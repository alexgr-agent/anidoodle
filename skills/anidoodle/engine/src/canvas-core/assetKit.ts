// ASSET KIT. Art that lives on someone's page: a hero beside a headline, a feature tile, a row of spots,
// a social card. Three things change when a picture leaves its own card and sits on a site:
//   1. placement: the art has a region, and the headline has a zone the art must never enter;
//   2. ground: the paper IS the page colour, so every neutral moves to suit it, light or dark;
//   3. brand: one hex becomes a whole material (body) or only its marks (ink), in either theme.
// Placement is plain numbers. Ground and brand are a palette: `setPalette(pagePalette(...))` and every
// material the kit paints is moved through it, so a machine is restyled without touching its parts.
import type { Material } from "./mechanismKit";

export type Rect = { x: number; y: number; w: number; h: number };
export type Placement = { W: number; H: number; art: Rect; safe?: Rect; pad: number; note: string };

/** canvases by where the art sits. Sizes are about 1 unit per CSS pixel at the size the art is shown. */
export const PLACEMENTS: Record<string, Placement> = {
  heroRight: { W: 1200, H: 640, art: { x: 520, y: 40, w: 640, h: 560 }, safe: { x: 0, y: 0, w: 480, h: 640 }, pad: 24, note: "headline left, art right; the moment faces the text" },
  heroLeft: { W: 1200, H: 640, art: { x: 40, y: 40, w: 640, h: 560 }, safe: { x: 720, y: 0, w: 480, h: 640 }, pad: 24, note: "the mirror of heroRight" },
  heroCentre: { W: 1200, H: 720, art: { x: 180, y: 210, w: 840, h: 480 }, safe: { x: 0, y: 0, w: 1200, h: 190 }, pad: 24, note: "headline above, a wide low object below" },
  art: { W: 800, H: 600, art: { x: 0, y: 0, w: 800, h: 600 }, pad: 28, note: "the page lays out its own text" },
  tile: { W: 640, H: 480, art: { x: 0, y: 0, w: 640, h: 480 }, pad: 32, note: "a feature card" },
  spot: { W: 320, H: 320, art: { x: 0, y: 0, w: 320, h: 320 }, pad: 20, note: "one small object; cut detail, never shrink it to mush" },
  banner: { W: 1600, H: 400, art: { x: 0, y: 24, w: 1600, h: 352 }, pad: 24, note: "a section divider; may bleed off a clean straight edge" },
  social: { W: 1200, H: 630, art: { x: 560, y: 40, w: 600, h: 550 }, safe: { x: 0, y: 0, w: 520, h: 630 }, pad: 24, note: "a share card: words left, object right, carries its own ground" },
  slide: { W: 1920, H: 1080, art: { x: 800, y: 80, w: 1060, h: 920 }, safe: { x: 0, y: 0, w: 760, h: 1080 }, pad: 32, note: "a deck slide" },
};
/** the art region shrunk by its pad, as the corner box [x0, y0, x1, y1] `Cam.fit` takes */
export const fitBox = (p: Placement): [number, number, number, number] => [p.art.x + p.pad, p.art.y + p.pad, p.art.x + p.art.w - p.pad, p.art.y + p.art.h - p.pad];
/** where the eye should land: a third of the way into the art region, on the side nearest the text */
export const strongPoint = (p: Placement): [number, number] => {
  const towardText = p.safe ? (p.safe.x + p.safe.w / 2 < p.art.x + p.art.w / 2 ? 1 / 3 : 2 / 3) : 1 / 2;
  return [p.art.x + p.art.w * towardText, p.art.y + p.art.h * (p.safe && p.safe.w === p.W ? 1 / 3 : 0.45)];
};

// ---------------------------------------------------------------- colour in a perceptual space (OKLab)
type Lab = [number, number, number];
const toLin = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const toSrgb = (c: number) => (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const hexRgb = (h: string): [number, number, number] => { const n = parseInt(h.replace("#", "").slice(0, 6), 16); return [(n >> 16) & 255, (n >> 8) & 255, n & 255].map((v) => v / 255) as [number, number, number]; };
export const toLab = (hex: string): Lab => {
  const [r, g, b] = hexRgb(hex).map(toLin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const labRgb = ([L, a, b]: Lab): [number, number, number] => {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3, m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3, s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(toSrgb) as [number, number, number];
};
/** back to hex; a colour outside sRGB keeps its lightness and hue and gives up chroma until it fits */
export const fromLab = (lab: Lab): string => {
  let [L, a, b] = lab; L = Math.max(0, Math.min(1, L));
  for (let k = 0; k < 24; k++) { const rgb = labRgb([L, a, b]); if (rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4)) break; a *= 0.88; b *= 0.88; }
  return "#" + labRgb([L, a, b]).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("");
};
export const isDark = (paper: string) => toLab(paper)[0] < 0.6;

// ---------------------------------------------------------------- the page palette
export type Colour = string | { hex: string; mode?: "body" | "ink" };
export type PageOpts = {
  paper: string;              // the exact colour of the page the art sits on
  kitPaper?: string;          // the paper the materials were designed on (the kit's cream)
  tint?: number;              // 0 keeps neutral greys, 1 takes the page's whole colour cast; 0.5 by default
  accent?: Colour;            // the brand colour of the part to watch (materials with accent: true)
  colours?: Record<string, Colour>; // per material name: a brand or material colour (brass, walnut, ebony)
};

/** one hex as a five-step material ramp in a theme: hue and chroma kept, lightness set where four tones still read */
export const rampFrom = (hex: string, dark: boolean): { ramp: Material["ramp"]; seam: string; pigment: string } => {
  const [L0, a, b] = toLab(hex), c = dark ? Math.max(0.32, Math.min(0.64, L0 * 0.78)) : Math.max(0.36, Math.min(0.8, L0));
  const at = (L: number) => fromLab([L, a, b]);
  return { ramp: [at(c - 0.17), at(c - 0.09), at(c - 0.02), at(c + 0.06), at(Math.min(0.97, c + 0.15))], seam: at(c - (dark ? -0.12 : 0.26)), pigment: at(c) };
};

/** a palette for `setPalette`: every material moved onto the page, brand colours put in, light or dark */
export const pagePalette = (o: PageOpts): ((m: Material) => Material) => {
  const dark = isDark(o.paper), P = toLab(o.paper), K = toLab(o.kitPaper ?? "#f3f0e8"), tint = o.tint ?? 0.5;
  const da = (P[1] - K[1]) * tint, db = (P[2] - K[2]) * tint;
  // light page: everything moves by the page's difference in lightness and, by `tint`, in colour.
  // dark page: parts sit a little above the page, the lit top lightest, lines lighter than the faces.
  const move = (hex: string, base: number) => {
    const [L, a, b] = toLab(hex);
    if (!dark) return fromLab([L + (P[0] - K[0]), a + da, b + db]);
    return fromLab([P[0] + 0.07 + Math.max(0, L - base) * 0.85, a * 0.85 + da, b * 0.85 + db]);
  };
  const cache = new Map<string, Material>();
  return (m) => {
    const key = (m.name ?? "") + m.ramp.join("") + m.ink; let out = cache.get(key); if (out) return out;
    const base = toLab(m.ramp[0])[0] - 0.02;
    out = { ...m, ramp: m.ramp.map((c) => move(c, base)) as Material["ramp"], seam: dark ? fromLab([P[0] + 0.2, da, db]) : move(m.seam, base), ink: dark ? fromLab([Math.min(0.93, P[0] + 0.62), da, db]) : move(m.ink, base), pigment: m.pigment ? move(m.pigment, base - 0.25) : m.pigment };
    const want = (m.accent ? o.accent : undefined) ?? (m.name ? o.colours?.[m.name] : undefined);
    if (want) {
      const { hex, mode = "body" } = typeof want === "string" ? { hex: want } : want, r = rampFrom(hex, dark);
      // body: the part is made of the colour. ink: the part stays neutral and only its lines and dots take it.
      out = mode === "body" ? { ...out, ramp: r.ramp, seam: r.seam, pigment: r.pigment } : { ...out, ink: r.pigment, seam: r.pigment };
    }
    cache.set(key, out); return out;
  };
};
