/**
 * Procedural audio: sodium-lamp ballast hum, distant traffic,
 * the occasional passing car, and a little lo-fi busking melody —
 * plus occasional quiet leaks of real songs via scRadio.ts, each one
 * washed over with room noise (setWash) so it never sounds pristine.
 * No assets, everything is synthesised with the Web Audio API.
 */
import { scRadio } from "./scRadio";

/** noise wash laid over a leaking song: level + fades matching scRadio's */
const WASH = 0.045;
const WASH_IN_MS = 1600;
const WASH_OUT_MS = 2400;

class GameAudio {
  ctx: AudioContext | null = null;
  master: GainNode | null = null;
  humGain: GainNode | null = null;
  trafficGain: GainNode | null = null;
  washGain: GainNode | null = null;
  washActive = false;
  brown: AudioBuffer | null = null;
  white: AudioBuffer | null = null;
  started = false;
  muted = false;

  /** resume a suspended context — call on any real user gesture */
  unlock() {
    if (!this.started) this.init();
    if (this.ctx && this.ctx.state === "suspended") void this.ctx.resume();
  }

  init() {
    if (this.started) return;
    const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return;
    this.started = true;
    const ctx = new Ctor();
    this.ctx = ctx;
    if (ctx.state === "suspended") void ctx.resume();
    const master = ctx.createGain();
    master.gain.value = this.muted ? 0 : 0.9;
    master.connect(ctx.destination);
    this.master = master;
    this.makeNoise();

    // distant traffic bed
    const traffic = ctx.createBufferSource();
    traffic.buffer = this.brown;
    traffic.loop = true;
    const tLp = ctx.createBiquadFilter();
    tLp.type = "lowpass";
    tLp.frequency.value = 240;
    const tGain = ctx.createGain();
    tGain.gain.value = 0.07;
    traffic.connect(tLp).connect(tGain).connect(master);
    traffic.start();
    this.trafficGain = tGain;

    // sodium lamp ballast hum
    const hum = ctx.createGain();
    hum.gain.value = 0.02;
    hum.connect(master);
    this.humGain = hum;
    const hLp = ctx.createBiquadFilter();
    hLp.type = "lowpass";
    hLp.frequency.value = 520;
    hLp.connect(hum);
    const o1 = ctx.createOscillator();
    o1.type = "sawtooth";
    o1.frequency.value = 100;
    const o2 = ctx.createOscillator();
    o2.type = "sine";
    o2.frequency.value = 200;
    const o3 = ctx.createOscillator();
    o3.type = "triangle";
    o3.frequency.value = 50;
    const g2 = ctx.createGain();
    g2.gain.value = 0.35;
    o1.connect(hLp);
    o3.connect(hLp);
    o2.connect(g2).connect(hLp);
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 6.5;
    const lfoG = ctx.createGain();
    lfoG.gain.value = 0.006;
    lfo.connect(lfoG).connect(hum.gain);
    o1.start();
    o2.start();
    o3.start();
    lfo.start();

    // faint electrical crackle
    const rat = ctx.createBufferSource();
    rat.buffer = this.white;
    rat.loop = true;
    const rBp = ctx.createBiquadFilter();
    rBp.type = "bandpass";
    rBp.frequency.value = 3200;
    rBp.Q.value = 2;
    const rG = ctx.createGain();
    rG.gain.value = 0.012;
    rat.connect(rBp).connect(rG).connect(master);
    rat.start();

    this.scheduleTraffic();
    this.scheduleRadio();
  }

  private makeNoise() {
    if (!this.ctx) return;
    const ctx = this.ctx;
    const len = ctx.sampleRate * 2;
    const brown = ctx.createBuffer(1, len, ctx.sampleRate);
    const white = ctx.createBuffer(1, len, ctx.sampleRate);
    const b = brown.getChannelData(0);
    const w = white.getChannelData(0);
    let last = 0;
    for (let i = 0; i < len; i++) {
      const v = Math.random() * 2 - 1;
      w[i] = v;
      last = (last + 0.02 * v) / 1.02;
      b[i] = last * 3.2;
    }
    this.brown = brown;
    this.white = white;
  }

  private scheduleTraffic() {
    const loop = () => {
      if (!this.ctx || !this.trafficGain) return;
      const t = this.ctx.currentTime;
      this.trafficGain.gain.setTargetAtTime(0.03 + Math.random() * 0.08, t, 1.6);
      if (Math.random() < 0.35) this.passCar();
      window.setTimeout(loop, 4000 + Math.random() * 6000);
    };
    loop();
  }

  /** a car going by somewhere behind the buildings */
  private passCar() {
    if (!this.ctx || !this.master || !this.white) return;
    const ctx = this.ctx;
    const t = ctx.currentTime;
    const dur = 2.8 + Math.random() * 1.5;
    const src = ctx.createBufferSource();
    src.buffer = this.white;
    src.loop = true;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.Q.value = 0.8;
    bp.frequency.setValueAtTime(220, t);
    bp.frequency.linearRampToValueAtTime(900, t + dur * 0.5);
    bp.frequency.linearRampToValueAtTime(220, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.06, t + dur * 0.5);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const dir = Math.random() < 0.5 ? 1 : -1;
    let out: AudioNode = g;
    if (typeof ctx.createStereoPanner === "function") {
      const pan = ctx.createStereoPanner();
      pan.pan.setValueAtTime(-dir, t);
      pan.pan.linearRampToValueAtTime(dir, t + dur);
      g.connect(pan);
      out = pan;
    }
    src.connect(bp).connect(g);
    out.connect(this.master);
    src.start(t);
    src.stop(t + dur + 0.1);
  }

  /* ------------------------------------------------------------------ */
  /*  faint intercepted music — something quiet leaks in once in a while */
  /* ------------------------------------------------------------------ */

  private scheduleRadio() {
    const loop = () => {
      if (!this.ctx || !this.master) return;
      const r = Math.random();
      // 60% a real song leak, 17% radio snatch, 15% phone, 8% quiet night
      // (when SoundCloud is dead the sc branch falls through to radio)
      if (r < 0.6 && scRadio.available) this.scLeak();
      else if (r < 0.77) this.radioSnatch();
      else if (r < 0.92) this.phoneBleed();
      window.setTimeout(loop, 45000 + Math.random() * 45000);
    };
    window.setTimeout(loop, 15000 + Math.random() * 15000);
  }

  /**
   * A real song leaking in from a window somewhere — 10-30s, fading in
   * and out (scRadio handles the widget). Falls back to the procedural
   * radio if SoundCloud is unreachable/blocked/the track refused to load.
   */
  private scLeak() {
    void scRadio.snippet().then((ok) => {
      if (!ok) this.radioSnatch();
    });
  }

  /** a distant radio catching a few bars — grainy, breaking up, drifting past */
  private radioSnatch() {
    if (!this.ctx || !this.master || !this.white) return;
    const ctx = this.ctx;
    const master = this.master;
    const t = ctx.currentTime;
    const notes = [349.23, 392, 440, 392, 329.63, 349.23, 293.66, 261.63, 293.66, 349.23, 329.63];
    const step = 0.26 + Math.random() * 0.08;
    const dur = notes.length * step + 0.7;

    // small-speaker band: no rumble, no sparkle
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 250;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2200;
    hp.connect(lp);

    // the signal keeps losing the station for a frame
    const am = ctx.createGain();
    am.gain.value = 1;
    lp.connect(am);
    let at = t + 0.3;
    while (at < t + dur - 0.45) {
      am.gain.setValueAtTime(1, at);
      am.gain.linearRampToValueAtTime(0.12 + Math.random() * 0.5, at + 0.012);
      am.gain.linearRampToValueAtTime(1, at + 0.05 + Math.random() * 0.1);
      at += 0.18 + Math.random() * 0.35;
    }

    // drifts from one side to the other, like whatever's playing passes by
    let tail: AudioNode = am;
    if (typeof ctx.createStereoPanner === "function") {
      const pan = ctx.createStereoPanner();
      const dir = Math.random() < 0.5 ? 1 : -1;
      pan.pan.setValueAtTime(-0.7 * dir, t);
      pan.pan.linearRampToValueAtTime(0.7 * dir, t + dur);
      am.connect(pan);
      tail = pan;
    }

    // one fader: quiet, snaps in like a station locking on, fades out slow
    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, t);
    bus.gain.exponentialRampToValueAtTime(0.16, t + 0.25);
    bus.gain.setValueAtTime(0.16, t + dur - 0.8);
    bus.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    tail.connect(bus).connect(master);

    // thin hiss riding along underneath it
    const s = ctx.createBufferSource();
    s.buffer = this.white;
    s.loop = true;
    const sBp = ctx.createBiquadFilter();
    sBp.type = "bandpass";
    sBp.frequency.value = 1900;
    sBp.Q.value = 0.5;
    const sG = ctx.createGain();
    sG.gain.setValueAtTime(0.0001, t);
    sG.gain.exponentialRampToValueAtTime(0.12, t + 0.3);
    sG.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(sBp).connect(sG).connect(am);

    // a few bars, sliding slightly flat like worn tape
    notes.forEach((f, i) => {
      const st = t + 0.2 + i * step;
      const o = ctx.createOscillator();
      o.type = i % 2 === 0 ? "square" : "sawtooth";
      const o2 = ctx.createOscillator();
      o2.type = "triangle";
      o2.detune.value = 9;
      o.frequency.setValueAtTime(f, st);
      o.frequency.linearRampToValueAtTime(f * 0.986, st + step);
      o2.frequency.setValueAtTime(f, st);
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.15, st + 0.05);
      g.gain.exponentialRampToValueAtTime(0.0001, st + step * 0.98);
      o.connect(g);
      o2.connect(g);
      g.connect(hp);
      o.start(st);
      o2.start(st);
      o.stop(st + step + 0.03);
      o2.stop(st + step + 0.03);
    });
  }

  /** someone's phone down the block fired off a notification tune */
  private phoneBleed() {
    if (!this.ctx || !this.master || !this.white) return;
    const ctx = this.ctx;
    const master = this.master;
    const t = ctx.currentTime;
    const notes = [440, 523.25, 659.26, 0, 523.25]; // 0 = a rest
    const step = 0.15;
    const dur = notes.length * step + 0.45;

    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 480;
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 3400;
    hp.connect(lp);

    // one ear only — like an earbud just came out
    let tail: AudioNode = lp;
    if (typeof ctx.createStereoPanner === "function") {
      const pan = ctx.createStereoPanner();
      pan.pan.value = (Math.random() < 0.5 ? -1 : 1) * (0.6 + Math.random() * 0.3);
      lp.connect(pan);
      tail = pan;
    }

    const bus = ctx.createGain();
    bus.gain.setValueAtTime(0.0001, t);
    bus.gain.exponentialRampToValueAtTime(0.2, t + 0.05);
    bus.gain.setValueAtTime(0.2, t + dur - 0.35);
    bus.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    tail.connect(bus).connect(master);

    notes.forEach((f, i) => {
      const st = t + i * step;
      if (f === 0) return;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.17, st + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.32);
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const o2 = ctx.createOscillator();
      o2.type = "triangle";
      o2.frequency.value = f * 2;
      const g2 = ctx.createGain();
      g2.gain.value = 0.4;
      o.connect(g);
      o2.connect(g2).connect(g);
      g.connect(hp);
      o.start(st);
      o2.start(st);
      o.stop(st + 0.35);
      o2.stop(st + 0.35);

      // a little speaker grain under each plink
      const s = ctx.createBufferSource();
      s.buffer = this.white;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2600;
      bp.Q.value = 1.5;
      const sg = ctx.createGain();
      sg.gain.setValueAtTime(0.0001, st);
      sg.gain.exponentialRampToValueAtTime(0.05, st + 0.005);
      sg.gain.exponentialRampToValueAtTime(0.0001, st + 0.05);
      s.connect(bp).connect(sg).connect(hp);
      s.start(st, Math.random());
      s.stop(st + 0.07);
    });
  }

  setMuted(m: boolean) {
    this.muted = m;
    // the SoundCloud widget lives outside the Web Audio graph —
    // its volume has to be zeroed separately (scRadio keeps its own
    // fade state, so unmuting restores whatever level was playing)
    scRadio.setMuted(m);
    if (this.master && this.ctx) {
      this.master.gain.cancelScheduledValues(this.ctx.currentTime);
      this.master.gain.setTargetAtTime(m ? 0 : 0.9, this.ctx.currentTime, 0.08);
    }
  }

  /**
   * A bed of room/street noise laid OVER a leaking song. The widget is
   * cross-origin — its stream can never be filtered — so masking the
   * clarity happens on our side: broadband hiss that rises with the
   * song's fade-in and leaves with its fade-out.
   */
  setWash(on: boolean) {
    if (!this.ctx || !this.master || !this.white) return;
    const ctx = this.ctx;
    if (!this.washGain || this.washGain.context !== ctx) {
      const src = ctx.createBufferSource();
      src.buffer = this.white;
      src.loop = true;
      const hp = ctx.createBiquadFilter();
      hp.type = "highpass";
      hp.frequency.value = 320; // no mud — this sits on TOP of the music
      const lp = ctx.createBiquadFilter();
      lp.type = "lowpass";
      lp.frequency.value = 4800; // air band: hiss, not tone
      const g = ctx.createGain();
      g.gain.value = 0;
      src.connect(hp).connect(lp).connect(g).connect(this.master);
      // brightness drifts slowly so the bed breathes instead of sitting static
      const lfo = ctx.createOscillator();
      lfo.frequency.value = 0.15;
      const lfoG = ctx.createGain();
      lfoG.gain.value = 1400;
      lfo.connect(lfoG).connect(lp.frequency);
      src.start();
      lfo.start();
      this.washGain = g;
    }
    const g = this.washGain;
    const t = ctx.currentTime;
    const cur = g.gain.value;
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(cur, t);
    g.gain.linearRampToValueAtTime(on ? WASH : 0, t + (on ? WASH_IN_MS : WASH_OUT_MS) / 1000);
    this.washActive = on;
  }

  /** one sung note */
  note(freq: number, dur = 0.45, vol = 0.16) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master: AudioNode = this.master;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    osc.type = "square";
    const osc2 = ctx.createOscillator();
    osc2.type = "triangle";
    osc.frequency.setValueAtTime(freq, t);
    osc2.frequency.setValueAtTime(freq * 2.002, t);
    osc.frequency.linearRampToValueAtTime(freq * 0.985, t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.05);
    g.gain.setValueAtTime(vol, t + dur * 0.6);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 1500;
    osc.connect(g);
    osc2.connect(g);
    g.connect(lp).connect(master);
    osc.start(t);
    osc2.start(t);
    osc.stop(t + dur + 0.05);
    osc2.stop(t + dur + 0.05);
  }

  /** coin / tip blip */
  coin() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master: AudioNode = this.master;
    const t = ctx.currentTime;
    [1318, 1760].forEach((f, i) => {
      const o = ctx.createOscillator();
      o.type = "square";
      o.frequency.value = f;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t + i * 0.07);
      g.gain.exponentialRampToValueAtTime(0.09, t + i * 0.07 + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + i * 0.07 + 0.16);
      o.connect(g).connect(master);
      o.start(t + i * 0.07);
      o.stop(t + i * 0.07 + 0.2);
    });
  }

  /** the lamp's ballast struggling for a moment */
  zap() {
    if (!this.ctx || !this.master || !this.white) return;
    const ctx = this.ctx;
    const master: AudioNode = this.master;
    const t = ctx.currentTime;
    if (this.humGain) {
      this.humGain.gain.setTargetAtTime(0.004, t, 0.01);
      this.humGain.gain.setTargetAtTime(0.02, t + 0.18, 0.06);
    }
    const src = ctx.createBufferSource();
    src.buffer = this.white;
    const bp = ctx.createBiquadFilter();
    bp.type = "bandpass";
    bp.frequency.value = 2600;
    bp.Q.value = 3;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.05, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    src.connect(bp).connect(g).connect(master);
    src.start(t, Math.random());
    src.stop(t + 0.2);
  }

  /** short animal-crossing-style voice blip */
  blip(freq = 600, dur = 0.07, vol = 0.08) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master: AudioNode = this.master;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "square";
    o.frequency.setValueAtTime(freq * (1 + (Math.random() - 0.5) * 0.08), t);
    o.frequency.exponentialRampToValueAtTime(Math.max(40, freq * 0.72), t + dur);
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.008);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2400;
    o.connect(g).connect(lp).connect(master);
    o.start(t);
    o.stop(t + dur + 0.02);
  }

  /** a small orange cat going "mrow" — pitch sweeps up, then away */
  meow(big = true) {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master: AudioNode = this.master;
    const t = ctx.currentTime;
    const o = ctx.createOscillator();
    o.type = "triangle";
    const g = ctx.createGain();
    const lp = ctx.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = 2400;
    const f = 470 + Math.random() * 110;
    const dur = big ? 0.36 : 0.17;
    o.frequency.setValueAtTime(f * 0.78, t);
    o.frequency.exponentialRampToValueAtTime(f * (big ? 1.5 : 1.8), t + dur * 0.24);
    o.frequency.exponentialRampToValueAtTime(f * 0.58, t + dur);
    const vol = big ? 0.05 : 0.035;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + 0.025);
    g.gain.setValueAtTime(vol, t + dur * 0.55);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g).connect(lp).connect(master);
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  /** a burst of voice blips sized to the line */
  say(pitch: number, syllables: number) {
    const n = Math.max(2, Math.min(14, Math.round(syllables)));
    for (let i = 0; i < n; i++) {
      window.setTimeout(() => this.blip(pitch * (1 + (Math.random() - 0.5) * 0.15), 0.06, 0.055), i * 95);
    }
  }

  /** quick delighted giggle */
  giggle(pitch = 700) {
    for (let i = 0; i < 4; i++) {
      window.setTimeout(() => this.blip(pitch + i * 90, 0.06, 0.07), i * 80);
    }
  }

  /** riffle shuffle: a run of paper swishes */
  shuffle() {
    if (!this.ctx || !this.master || !this.white) return;
    const ctx = this.ctx;
    const master: AudioNode = this.master;
    for (let i = 0; i < 9; i++) {
      const t = ctx.currentTime + i * 0.11 + Math.random() * 0.03;
      const s = ctx.createBufferSource();
      s.buffer = this.white;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 2200 + Math.random() * 2200;
      bp.Q.value = 1.2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.1, t + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.07);
      s.connect(bp).connect(g).connect(master);
      s.start(t, Math.random());
      s.stop(t + 0.1);
    }
  }

  /** single card flip + soft table tap */
  flip() {
    if (!this.ctx || !this.master || !this.white) return;
    const ctx = this.ctx;
    const master: AudioNode = this.master;
    const t = ctx.currentTime;
    const s = ctx.createBufferSource();
    s.buffer = this.white;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 2600;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(0.12, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    s.connect(hp).connect(g).connect(master);
    s.start(t, Math.random());
    s.stop(t + 0.15);
    const o = ctx.createOscillator();
    o.type = "sine";
    o.frequency.setValueAtTime(220, t + 0.08);
    o.frequency.exponentialRampToValueAtTime(90, t + 0.16);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.0001, t + 0.08);
    g2.gain.exponentialRampToValueAtTime(0.14, t + 0.09);
    g2.gain.exponentialRampToValueAtTime(0.0001, t + 0.2);
    o.connect(g2).connect(master);
    o.start(t + 0.08);
    o.stop(t + 0.25);
  }

  /** mystical reveal shimmer */
  shimmer() {
    if (!this.ctx || !this.master) return;
    const ctx = this.ctx;
    const master: AudioNode = this.master;
    [523.25, 659.25, 783.99, 1046.5, 1318.5].forEach((f, i) => {
      const t = ctx.currentTime + i * 0.09;
      const o = ctx.createOscillator();
      o.type = "sine";
      o.frequency.value = f;
      const o2 = ctx.createOscillator();
      o2.type = "triangle";
      o2.frequency.value = f * 2;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(0.06, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + 0.9);
      o.connect(g);
      o2.connect(g);
      g.connect(master);
      o.start(t);
      o2.start(t);
      o.stop(t + 1);
      o2.stop(t + 1);
    });
  }

  /** shake the can, then spray */
  spray() {
    if (!this.ctx || !this.master || !this.white) return;
    const ctx = this.ctx;
    const master: AudioNode = this.master;
    const t = ctx.currentTime;
    for (let i = 0; i < 3; i++) {
      const s = ctx.createBufferSource();
      s.buffer = this.white;
      const bp = ctx.createBiquadFilter();
      bp.type = "bandpass";
      bp.frequency.value = 1500 + i * 200;
      bp.Q.value = 4;
      const g = ctx.createGain();
      const st = t + i * 0.085;
      g.gain.setValueAtTime(0.0001, st);
      g.gain.exponentialRampToValueAtTime(0.12, st + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, st + 0.03);
      s.connect(bp).connect(g).connect(master);
      s.start(st, Math.random());
      s.stop(st + 0.05);
    }
    const hiss = ctx.createBufferSource();
    hiss.buffer = this.white;
    hiss.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = "highpass";
    hp.frequency.value = 1800;
    const g = ctx.createGain();
    const st = t + 0.3;
    g.gain.setValueAtTime(0.0001, st);
    g.gain.exponentialRampToValueAtTime(0.11, st + 0.04);
    g.gain.setValueAtTime(0.11, st + 0.45);
    g.gain.exponentialRampToValueAtTime(0.0001, st + 0.7);
    hiss.connect(hp).connect(g).connect(master);
    hiss.start(st);
    hiss.stop(st + 0.75);
  }
}

export const audio = new GameAudio();

// the widget's stream can't be filtered — hang our noise wash off each leak
scRadio.onSnippet = (playing) => audio.setWash(playing);

/* ---- QA hook (typeof guard: the smokes import this module in Node) ---- */
if (typeof window !== "undefined") {
  const w = window as unknown as { __wash?: () => { on: boolean; level: number } };
  w.__wash = () => ({
    on: audio.washActive,
    level: audio.washGain ? audio.washGain.gain.value : -1,
  });
}

/** a cosy little pentatonic busking tune */
const SCALE = [196.0, 220.0, 261.63, 293.66, 349.23, 392.0, 440.0, 523.25];
export function nextSingNote(i: number) {
  const pattern = [0, 2, 4, 3, 5, 4, 2, 1, 0, 2, 5, 7, 5, 4, 2, 0];
  return SCALE[pattern[i % pattern.length]];
}
