import type { Sky } from "./types";

/* ------------------------------------------------------------------ */
/*  Low-precision ephemeris (Meeus, ch. 25 & 47).                      */
/*  Sun accurate to ~0.01°, moon to ~0.02° — far beyond what an        */
/*  astrology conversation needs, and zero dependencies.               */
/* ------------------------------------------------------------------ */

const RAD = Math.PI / 180;
const norm = (x: number) => ((x % 360) + 360) % 360;
const sind = (x: number) => Math.sin(x * RAD);
const cosd = (x: number) => Math.cos(x * RAD);

/** julian day number for a JS date */
const jd = (d: Date) => d.getTime() / 86400000 + 2440587.5;

/** julian centuries since J2000.0 */
const centuries = (jdn: number) => (jdn - 2451545.0) / 36525;

/** apparent geometric longitude of the sun, degrees */
export function sunLongitude(jdn: number): number {
  const T = centuries(jdn);
  const L0 = norm(280.46646 + 36000.76983 * T + 0.0003032 * T * T);
  const M = norm(357.52911 + 35999.05029 * T - 0.0001537 * T * T);
  const C =
    (1.914602 - 0.004817 * T - 0.000014 * T * T) * sind(M) +
    (0.019993 - 0.000101 * T) * sind(2 * M) +
    0.000289 * sind(3 * M);
  const omega = 125.04 - 1934.136 * T;
  return norm(L0 + C - 0.00569 - 0.00478 * sind(omega));
}

/** [coefficient, D, M, M', F] — main periodic terms of table 47.A */
const MOON_TERMS: [number, number, number, number, number][] = [
  [6.288774, 0, 0, 1, 0],
  [1.274027, 2, 0, -1, 0],
  [0.658314, 2, 0, 0, 0],
  [0.213618, 0, 0, 2, 0],
  [-0.185116, 0, 1, 0, 0],
  [-0.114332, 0, 0, 0, 2],
  [0.058793, 2, 0, -2, 0],
  [0.057066, 2, -1, -1, 0],
  [0.053322, 2, 0, 1, 0],
  [0.045758, 2, -1, 0, 0],
  [-0.040923, 0, 1, -1, 0],
  [-0.03472, 1, 0, 0, 0],
  [-0.030383, 0, 1, 1, 0],
  [0.015327, 2, 0, 0, -2],
  [-0.012528, 0, 0, 1, 2],
  [0.01098, 0, 0, 1, -2],
  [0.010675, 4, 0, -1, 0],
  [0.010034, 0, 0, 3, 0],
  [0.008548, 4, 0, -2, 0],
  [-0.007888, 2, 1, -1, 0],
  [-0.006766, 2, 1, 0, 0],
  [-0.005163, 1, 0, -1, 0],
  [0.004987, 1, 1, 0, 0],
  [0.004036, 2, -1, 1, 0],
  [0.003994, 2, 0, 2, 0],
];

/** mean longitude of the moon, degrees */
export function moonLongitude(jdn: number): number {
  const T = centuries(jdn);
  const Lp = norm(218.3164477 + 481267.88123421 * T - 0.0015786 * T * T);
  const D = norm(297.8501921 + 445267.1114034 * T - 0.0018819 * T * T);
  const M = norm(357.5291092 + 35999.0502909 * T - 0.0001536 * T * T);
  const Mp = norm(134.9633964 + 477198.8675055 * T + 0.0087414 * T * T);
  const F = norm(93.272095 + 483202.0175233 * T - 0.0036539 * T * T);
  const E = 1 - 0.002516 * T - 0.0000074 * T * T;

  let lon = Lp;
  for (const [c, d, m, mp, f] of MOON_TERMS) {
    const arg = d * D + m * M + mp * Mp + f * F;
    // eccentricity correction damps terms with M to the first power
    const ecc = m === 0 ? 1 : Math.abs(m) === 1 ? E : E * E;
    lon += c * ecc * sind(arg);
  }
  return norm(lon);
}

const SIGNS = [
  "aries",
  "taurus",
  "gemini",
  "cancer",
  "leo",
  "virgo",
  "libra",
  "scorpio",
  "sagittarius",
  "capricorn",
  "aquarius",
  "pisces",
] as const;

export const signOf = (lon: number) => SIGNS[Math.floor(norm(lon) / 30) % 12];

function phaseName(elong: number): string {
  if (elong < 11.25 || elong >= 348.75) return "new moon";
  if (elong < 78.75) return "waxing crescent";
  if (elong < 101.25) return "first quarter";
  if (elong < 168.75) return "waxing gibbous";
  if (elong < 191.25) return "full moon";
  if (elong < 258.75) return "waning gibbous";
  if (elong < 281.25) return "last quarter";
  return "waning crescent";
}

const MONTHS = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** everything the girls can honestly say about tonight's sky */
export function getSky(now = new Date()): Sky {
  const jdn = jd(now);
  const sun = sunLongitude(jdn);
  const moon = moonLongitude(jdn);
  const elong = norm(moon - sun);
  return {
    dateLabel: `${now.getDate()} ${MONTHS[now.getMonth()]} ${now.getFullYear()}`,
    weekday: DAYS[now.getDay()],
    sunSign: signOf(sun),
    moonSign: signOf(moon),
    moonPhase: phaseName(elong),
    moonIllum: Math.round(((1 - cosd(elong)) / 2) * 100),
  };
}
