/* ------------------------------------------------------------------ */
/*  Thin wire to /api/generate.                                        */
/*  Never throws, never blocks — a dead endpoint just returns null and */
/*  the game falls back to the handwritten script.                     */
/* ------------------------------------------------------------------ */

export type AiState = "unknown" | "up" | "down";
let state: AiState = "unknown";

export const aiState = () => state;
export const aiIsUp = () => state === "up";

export async function generate<T>(req: unknown, timeoutMs = 20000): Promise<T | null> {
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const ctl = new AbortController();
      const timer = window.setTimeout(() => ctl.abort(), timeoutMs);
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(req),
        signal: ctl.signal,
      });
      window.clearTimeout(timer);

      if (!res.ok) {
        // 4xx won't fix themselves on retry; 5xx might
        if (res.status >= 500 && attempt === 0) continue;
        state = "down";
        return null;
      }
      const json = (await res.json()) as { ok?: boolean; data?: T };
      if (!json || json.ok !== true || json.data == null) {
        state = "down";
        return null;
      }
      state = "up";
      return json.data;
    } catch {
      if (attempt === 0) continue;
      state = "down";
      return null;
    }
  }
  return null;
}
