/**
 * Occasional real produced tracks leaking in from a window somewhere —
 * quiet, recognisable, cutting in and out.
 *
 * Uses the official SoundCloud Widget (no API key): an offscreen iframe
 * driven with play/pause/setVolume. The widget is cross-origin, so its
 * audio can never pass through our Web Audio graph — no lowpass on the
 * stream itself. What we can do is fade it in, duck it through mid-track
 * dropouts, and keep it low while the scene's own noise beds (traffic,
 * ballast hum, crackle) sit around it — that's what sells the distance.
 *
 * Verified quirks (headless Edge, 2026-09): widget.load() poisons the
 * player (ERROR event, getters return null, play() no-ops) and seekTo()
 * stalls playback at 0 — so tracks switch by recycling the whole iframe
 * and snippets always start from the top. Uploaders who disabled
 * embedding fire ERROR on a fresh iframe; those tracks get dropped from
 * the rotation instead of killing the feature.
 *
 * If SoundCloud is unreachable (blocked, offline), the attempt fails
 * cleanly and audio.ts falls back to the procedural radio/phone bursts.
 */

type ScWidget = {
  bind(event: string, cb: (data?: unknown) => void): void;
  play(): void;
  pause(): void;
  setVolume(v: number): void;
  getVolume(cb: (v: number) => void): void;
  getDuration(cb: (d: number) => void): void;
  getPosition(cb: (p: number) => void): void;
};

type ScGlobal = {
  Widget: ((el: HTMLIFrameElement) => ScWidget) & {
    Events: { READY: string; ERROR: string };
  };
};

/** verified embed-enabled (oEmbed 200) — pop / alt, on-vibe for the night */
const TRACKS = [
  "https://soundcloud.com/beabadoobee/nothing-to-prove",
  "https://soundcloud.com/beabadoobee/powerlines",
  "https://soundcloud.com/beabadoobee/its-alright",
  "https://soundcloud.com/homeshake/meeting-god",
  "https://soundcloud.com/homeshake/drunk-driver",
  "https://soundcloud.com/homeshake/new-york-city",
  "https://soundcloud.com/cherryglazerr/golden",
  "https://soundcloud.com/cherryglazerr/ready-for-you",
  "https://soundcloud.com/cherryglazerr/addicted-to-your-love",
];

/** widget volume 0-100 — audible over the street, still background-quiet */
const PEAK = 20;
const FADE_IN_MS = 1600;
const FADE_OUT_MS = 2400;
const MIN_MS = 10000; // "playing for like 20s, half a min, 10 sec..."
const MAX_MS = 30000; // "...anywhere in between"
const READY_TIMEOUT_MS = 10000;

const sleep = (ms: number) => new Promise<void>((r) => window.setTimeout(r, ms));

function playerURL(track: string): string {
  const p = new URLSearchParams({
    url: track,
    auto_play: "false",
    show_artwork: "false",
    show_user: "false",
    single_active: "false",
  });
  return `https://w.soundcloud.com/player/?${p.toString()}`;
}

function loadScript(): Promise<ScGlobal> {
  const w = window as unknown as { SC?: ScGlobal };
  if (w.SC) return Promise.resolve(w.SC);
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://w.soundcloud.com/player/api.js";
    s.async = true;
    s.onload = () => {
      const g = (window as unknown as { SC?: ScGlobal }).SC;
      if (g) resolve(g);
      else reject(new Error("SC widget api missing"));
    };
    s.onerror = () => reject(new Error("sc widget api blocked"));
    document.head.appendChild(s);
  });
}

class ScRadio {
  private iframe: HTMLIFrameElement | null = null;
  private widget: ScWidget | null = null;
  private dead = new Set<number>();
  private broken = false;
  private fails = 0;
  private busy = false;
  private muted = false;
  private peak = PEAK;
  /** logical volume we want right now (0..peak) — pushed through muted */
  private vol = 0;
  private current = -1;
  private fadeTimer = 0;
  private ready = false;
  private readyWait: ((ok: boolean) => void) | null = null;

  get available(): boolean {
    return !this.broken && this.dead.size < TRACKS.length;
  }

  setMuted(m: boolean) {
    this.muted = m;
    this.pushVol();
  }

  setPeak(v: number) {
    this.peak = Math.max(0, Math.min(100, v));
    if (this.vol > 0) {
      this.vol = Math.min(this.vol, this.peak);
      this.pushVol();
    }
  }

  /** one leak: spin up a track, fade in, duck out and stop */
  async snippet(durMs?: number): Promise<boolean> {
    // busy or deliberately silent → skip, but that's not a failure
    if (this.busy || this.muted) return true;
    if (!this.available) return false;
    this.busy = true;
    try {
      const idx = this.pick();
      if (idx < 0) return false;
      // fresh iframe per track: widget.load() poisons the player (see header)
      if (!(await this.spinUp(idx))) return false;

      const total = durMs ?? MIN_MS + Math.random() * (MAX_MS - MIN_MS);
      this.widget?.play();
      await this.ramp(this.peak, FADE_IN_MS);
      await this.ducks(total);
      await this.ramp(0, FADE_OUT_MS);
      this.widget?.pause();
      return true;
    } catch {
      this.fails++;
      if (this.fails >= 3) this.broken = true;
      this.silence();
      return false;
    } finally {
      this.busy = false;
      if (this.fadeTimer) {
        window.clearInterval(this.fadeTimer);
        this.fadeTimer = 0;
      }
    }
  }

  position(): Promise<number> {
    return this.getter((w, cb) => w.getPosition(cb), -1);
  }

  volume(): Promise<number> {
    return this.getter((w, cb) => w.getVolume(cb), -1);
  }

  status() {
    return {
      available: this.available,
      busy: this.busy,
      muted: this.muted,
      hasWidget: !!this.widget,
      ready: this.ready,
      current: this.current,
      fails: this.fails,
      dead: [...this.dead],
      vol: this.vol,
      peak: this.peak,
    };
  }

  /* ---------------------------------------------------------------- */

  /** tear down any previous player and load `idx` on a brand-new iframe */
  private async spinUp(idx: number): Promise<boolean> {
    if (this.broken) return false;
    const SC = await loadScript();
    this.dropPlayer();
    // claim the index first: an embed-disabled ERROR must blacklist THIS track
    this.current = idx;

    const iframe = document.createElement("iframe");
    iframe.setAttribute("allow", "autoplay");
    iframe.title = "background player";
    // parked offscreen — display:none risks the browser suspending it
    iframe.style.cssText = "position:fixed;top:0;left:-4000px;width:420px;height:140px;border:0;";
    iframe.src = playerURL(TRACKS[idx]);
    document.body.appendChild(iframe);
    const w = SC.Widget(iframe);
    this.iframe = iframe;
    this.widget = w;
    let errored = false;
    w.bind(SC.Widget.Events.ERROR, () => {
      // fail the pending wait instead of sleeping out READY_TIMEOUT;
      // onError counts the failure itself — don't double-count below
      errored = true;
      this.readyWait?.(false);
      this.onError();
    });

    const ready = await new Promise<boolean>((resolve) => {
      let done = false;
      const finish = (ok: boolean) => {
        if (done) return;
        done = true;
        window.clearTimeout(timer);
        this.readyWait = null;
        resolve(ok);
      };
      const timer = window.setTimeout(() => finish(false), READY_TIMEOUT_MS);
      this.readyWait = (ok) => finish(ok);
      w.bind(SC.Widget.Events.READY, () => finish(true));
    });

    if (!ready) {
      // slow network (not errored) counts toward broken; a real ERROR
      // already counted + blacklisted in onError
      if (!errored) {
        this.fails++;
        if (this.fails >= 3) this.broken = true;
      }
      this.dropPlayer();
      return false;
    }
    // pre-READY setVolume calls are silently dropped by the widget
    // (its default is 100) — zero it now that calls land
    this.ready = true;
    this.pushVol();
    return true;
  }

  private dropPlayer() {
    if (this.fadeTimer) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = 0;
    }
    this.iframe?.remove();
    this.iframe = null;
    this.widget = null;
    this.ready = false;
    this.current = -1;
    this.vol = 0;
  }

  private onError() {
    // on a fresh iframe this means the upload blocked embedding
    if (this.current >= 0) this.dead.add(this.current);
    this.fails++;
    if (this.dead.size >= TRACKS.length || this.fails >= 3) this.broken = true;
    this.vol = 0;
    this.pushVol();
    this.widget?.pause();
  }

  private pick(): number {
    const pool: number[] = [];
    for (let i = 0; i < TRACKS.length; i++) {
      if (i !== this.current && !this.dead.has(i)) pool.push(i);
    }
    if (!pool.length) {
      this.broken = true;
      return -1;
    }
    return pool[Math.floor(Math.random() * pool.length)];
  }

  /** quiet time inside the leak: fade out and back, like passing a doorway */
  private async ducks(total: number): Promise<void> {
    const settle = 700;
    const deadline = Date.now() + Math.max(0, total - FADE_IN_MS - settle);
    const dips = Math.random() < 0.55 ? (Math.random() < 0.35 ? 2 : 1) : 0;
    for (let i = 0; i < dips; i++) {
      const gap = 1500 + Math.random() * 3500;
      const left = deadline - Date.now();
      if (left <= 400) break;
      await sleep(Math.min(gap, left));
      if (Date.now() >= deadline) break;
      await this.ramp(this.peak * 0.18, 140);
      await sleep(160 + Math.random() * 520);
      await this.ramp(this.peak, 240);
    }
    const tail = deadline - Date.now();
    if (tail > 0) await sleep(tail);
  }

  private ramp(to: number, ms: number): Promise<void> {
    return new Promise<void>((resolve) => {
      const from = this.vol;
      const steps = Math.max(2, Math.round(ms / 90));
      let i = 0;
      if (this.fadeTimer) window.clearInterval(this.fadeTimer);
      this.fadeTimer = window.setInterval(() => {
        i++;
        if (i >= steps) {
          window.clearInterval(this.fadeTimer);
          this.fadeTimer = 0;
          this.vol = to;
          this.pushVol();
          resolve();
          return;
        }
        this.vol = from + ((to - from) * i) / steps;
        this.pushVol();
      }, ms / steps);
    });
  }

  private pushVol() {
    // the widget drops commands issued before READY — don't pretend we set it
    if (!this.ready) return;
    this.widget?.setVolume(this.muted ? 0 : this.vol);
  }

  private silence() {
    if (this.fadeTimer) {
      window.clearInterval(this.fadeTimer);
      this.fadeTimer = 0;
    }
    this.vol = 0;
    this.pushVol();
    this.widget?.pause();
  }

  private getter(fn: (w: ScWidget, cb: (v: number) => void) => void, fallback = 0): Promise<number> {
    const w = this.widget;
    if (!w) return Promise.resolve(fallback);
    return new Promise<number>((resolve) => {
      let done = false;
      const timer = window.setTimeout(() => {
        if (!done) {
          done = true;
          resolve(fallback);
        }
      }, 2500);
      fn(w, (v) => {
        if (!done) {
          done = true;
          window.clearTimeout(timer);
          resolve(v);
        }
      });
    });
  }
}

export const scRadio = new ScRadio();

/* ---- QA hooks (same pattern as the cat's __cat* hooks) ---- */
// typeof guard: the smoke tests import this module in Node before `window` exists
if (typeof window !== "undefined") {
  const w = window as unknown as {
    __scBurst?: (ms?: number) => Promise<boolean>;
    __scState?: () => unknown;
    __scPos?: () => Promise<number>;
    __scVol?: () => Promise<number>;
    __scPeak?: (v: number) => void;
  };
  w.__scBurst = (ms?: number) => scRadio.snippet(ms);
  w.__scState = () => scRadio.status();
  w.__scPos = () => scRadio.position();
  w.__scVol = () => scRadio.volume();
  w.__scPeak = (v: number) => scRadio.setPeak(v);
}
