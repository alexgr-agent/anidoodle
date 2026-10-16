// Recorded voices. Decoding belongs to the host; a bank is only the manifest entry and 48 kHz PCM.
import type { Played } from "./perform";
import type { PedalSpan } from "./piano";
import type { Opts } from "./keysCore";
import { clamp, db, Biquad } from "./dsp";
import { nameOf } from "./theory";
import { rng } from "../core";
import { pianoVelocity } from "./keysPiano";
import { bandWidth } from "./mixDsp";

// Recordings made with spaced microphones can be out of phase between the sides in the body of the
// sound (150 Hz to 2 kHz: some marimba zones measure -0.72 file after file, which is one side's polarity
// flipped; tubular bells sit near 0, a grand piano about 0.3). On a phone or any mono fold the sides
// cancel and the music goes hollow. Each stereo recording is fixed once, when its bank is registered:
// a side whose body is clearly inverted is flipped back, then the body is narrowed (mono under 150 Hz,
// the side at half up to 2 kHz) while the air above 2 kHz keeps its full width.
export const RECORDING_WIDTH = Object.freeze({ monoHz: 150, splitHz: 2000, mid: 0.5, high: 1, flipBelow: -0.3 });
const narrowed = new WeakSet<Float32Array>();
const bodyCorr = (L: Float32Array, R: Float32Array) => {
  const f = () => [Biquad.make(48000, "hp", 150, 0.707), Biquad.make(48000, "lp", 2000, 0.707)], a = f(), b = f(); let c = 0, x = 0, y = 0;
  for (let i = 0; i < L.length; i++) { const l = a[1].tick(a[0].tick(L[i])), r = b[1].tick(b[0].tick(R[i])); c += l * r; x += l * l; y += r * r; }
  return x * y > 0 ? c / Math.sqrt(x * y) : 1;
};
const narrow = (ch: Float32Array[]): Float32Array[] => {
  if (ch.length !== 2 || narrowed.has(ch[0])) return ch;
  const L = ch[0].slice(), R = ch[1].slice();
  if (bodyCorr(L, R) < RECORDING_WIDTH.flipBelow) for (let i = 0; i < R.length; i++) R[i] = -R[i];
  bandWidth(L, R, 48000, RECORDING_WIDTH); narrowed.add(L); narrowed.add(R); return [L, R];
};

export type SampleZone = { file: string; midi: number; layer: number; rr: number; frames: number; channels: number; peakDb: number; rmsDb: number; sha256: string; art?: "sus" | "rel"; unpitched?: boolean; measuredHz?: number; loop?: [number, number] };
export type SampleEntry = { title: string; source: string; license: string; kind: "struck" | "sustained"; range: [number, number]; layers: number; layerVelocity?: number[]; sparse?: boolean; maxShift?: number; damped: boolean; normalized?: boolean; zones: SampleZone[] };
export type SampleTrim = { file: string; midi: number; layer: number; measuredDb: number; modeledDb: number; correctionDb: number; requestedDb?: number; medianDb?: number; boostLimited?: boolean;
  /** 500 Hz-4 kHz energy as a fraction of audible energy, and its excess over the modeled reference. */
  bandFractionDb?: number; bandExcessDb?: number };
export type SampleBank = { entry: SampleEntry; zones: { zone: SampleZone; channels: Float32Array[] }[]; /** fixed modeled references at each recording's pitch and layer centre */ trim?: SampleTrim[] };
export type RegisteredBank = SampleBank & { id: string; hash: string };
const banks = new Map<string, RegisteredBank>();
export const bankId = (inst: string, variant?: string) => variant ? `${inst}.${variant}` : inst;
export const bankFor = (inst: string, variant?: string) => banks.get(bankId(inst, variant));
export const clearBanks = () => banks.clear();

/** Synchronous SHA-256 of ASCII identity data, also available in the browser without a decoder. */
const hash = (s: string) => {
  const K = [0x428a2f98,0x71374491,0xb5c0fbcf,0xe9b5dba5,0x3956c25b,0x59f111f1,0x923f82a4,0xab1c5ed5,0xd807aa98,0x12835b01,0x243185be,0x550c7dc3,0x72be5d74,0x80deb1fe,0x9bdc06a7,0xc19bf174,0xe49b69c1,0xefbe4786,0x0fc19dc6,0x240ca1cc,0x2de92c6f,0x4a7484aa,0x5cb0a9dc,0x76f988da,0x983e5152,0xa831c66d,0xb00327c8,0xbf597fc7,0xc6e00bf3,0xd5a79147,0x06ca6351,0x14292967,0x27b70a85,0x2e1b2138,0x4d2c6dfc,0x53380d13,0x650a7354,0x766a0abb,0x81c2c92e,0x92722c85,0xa2bfe8a1,0xa81a664b,0xc24b8b70,0xc76c51a3,0xd192e819,0xd6990624,0xf40e3585,0x106aa070,0x19a4c116,0x1e376c08,0x2748774c,0x34b0bcb5,0x391c0cb3,0x4ed8aa4a,0x5b9cca4f,0x682e6ff3,0x748f82ee,0x78a5636f,0x84c87814,0x8cc70208,0x90befffa,0xa4506ceb,0xbef9a3f7,0xc67178f2];
  const h = [0x6a09e667,0xbb67ae85,0x3c6ef372,0xa54ff53a,0x510e527f,0x9b05688c,0x1f83d9ab,0x5be0cd19], b = new Uint8Array(Math.ceil((s.length + 9) / 64) * 64), w = new Int32Array(64), rot = (x: number, n: number) => (x >>> n) | (x << (32 - n));
  for (let i = 0; i < s.length; i++) b[i] = s.charCodeAt(i);
  b[s.length] = 128; const view = new DataView(b.buffer); view.setUint32(b.length - 4, s.length * 8);
  for (let off = 0; off < b.length; off += 64) {
    for (let i = 0; i < 16; i++) w[i] = view.getInt32(off + i * 4);
    for (let i = 16; i < 64; i++) { const a = w[i - 15], c = w[i - 2]; w[i] = w[i - 16] + (rot(a, 7) ^ rot(a, 18) ^ (a >>> 3)) + w[i - 7] + (rot(c, 17) ^ rot(c, 19) ^ (c >>> 10)); }
    let [a,c,d,e,f,g,j,k] = h;
    for (let i = 0; i < 64; i++) { const t = (k + (rot(f, 6) ^ rot(f, 11) ^ rot(f, 25)) + ((f & g) ^ (~f & j)) + K[i] + w[i]) | 0, u = ((rot(a, 2) ^ rot(a, 13) ^ rot(a, 22)) + ((a & c) ^ (a & d) ^ (c & d))) | 0; k = j; j = g; g = f; f = (e + t) | 0; e = d; d = c; c = a; a = (t + u) | 0; }
    [a,c,d,e,f,g,j,k].forEach((v, i) => h[i] = (h[i] + v) | 0);
  }
  return h.map((v) => (v >>> 0).toString(16).padStart(8, "0")).join("");
};
/** Hashes pin the recordings; the playable metadata also belongs in the identity (a changed range or mapping is a new voice). */
export const bankIdentity = (entry: SampleEntry) => hash(JSON.stringify([entry.kind, entry.range, entry.layers, entry.layerVelocity ?? null, entry.damped, entry.normalized === true, entry.zones.map((z) => [z.sha256.toLowerCase(), z.midi, z.layer, z.rr, z.frames, z.channels, z.unpitched === true, z.loop ?? null, ...(z.art ? [z.art] : [])])]));
export const registerBank = (id: string, bank: SampleBank): RegisteredBank => {
  const e = bank.entry;
  if (!Array.isArray(e.range) || e.range.length !== 2 || !e.range.every((p) => Number.isInteger(p) && p >= 0 && p <= 127) || e.range[0] > e.range[1] || !Number.isInteger(e.layers) || e.layers < 1 || typeof e.damped !== "boolean") throw new Error(`${id}: invalid sample range, layers or damping`);
  if (e.layerVelocity !== undefined && (!Array.isArray(e.layerVelocity) || e.layerVelocity.length !== e.layers || e.layerVelocity.some((v, i) => !Number.isFinite(v) || v < 0 || v > 1 || (i > 0 && v <= e.layerVelocity![i - 1])))) throw new Error(`${id}: layerVelocity needs one increasing centre in 0..1 per layer`);
  if (!Array.isArray(e.zones)) throw new Error(`${id}: invalid sample zones`);
  if (e.kind === "sustained") { if (e.zones.some((z) => !z.loop)) throw new Error(`${id}: sustained zone without a loop`); throw new Error(`${id}: sustained banks are not supported in pack version 1`); }
  if (e.kind !== "struck" || !e.zones.length || bank.zones.length !== e.zones.length) throw new Error(`${id}: invalid or empty sample bank`);
  bank.zones.forEach(({ zone: z, channels }, i) => {
    if (z.art !== undefined && z.art !== "sus" && z.art !== "rel") throw new Error(`${id}: invalid articulation ${z.file}`);
    if (JSON.stringify(z) !== JSON.stringify(e.zones[i]) || !Number.isInteger(z.midi) || z.midi < e.range[0] || z.midi > e.range[1] || !Number.isInteger(z.layer) || z.layer < 1 || z.layer > e.layers || !Number.isInteger(z.rr) || z.rr < 1 || !Number.isInteger(z.frames) || z.frames < 1 || ![1, 2].includes(z.channels) || !/^[a-f0-9]{64}$/i.test(z.sha256) || channels.length !== z.channels || channels.some((c) => !(c instanceof Float32Array) || c.length !== z.frames)) throw new Error(`${id}: invalid zone or PCM ${z.file}`);
  });
  if (!e.zones.some((z) => !z.art)) throw new Error(`${id}: no ordinary sample zones`);
  if (bank.trim && (new Set(bank.trim.map((t) => t.file)).size !== bank.trim.length || bank.trim.some((t) => !e.zones.some((z) => z.file === t.file && z.midi === t.midi && z.layer === t.layer) || ![t.measuredDb, t.modeledDb, t.correctionDb, t.requestedDb ?? 0, t.medianDb ?? 0, t.bandFractionDb ?? 0, t.bandExcessDb ?? 0].every(Number.isFinite) || (t.medianDb !== undefined && Math.abs(t.correctionDb - t.medianDb) > 9.000001) || (t.boostLimited !== undefined && typeof t.boostLimited !== "boolean")))) throw new Error(`${id}: invalid sampled calibration`);
  const identity = bankIdentity(e), b = { ...bank, zones: bank.zones.map((z) => ({ ...z, channels: narrow(z.channels) })), id, hash: bank.trim ? hash(JSON.stringify([identity, bank.trim])) : identity }; banks.set(id, b); return b;
};

const layerV = (e: SampleEntry, layer: number) => e.layerVelocity?.[layer - 1] ?? (layer - 0.5) / e.layers;
/** Relative filtering is the default; the alternatives support a controlled audition. */
export const sampleCutoff = (e: SampleEntry, z: SampleZone, k: Played, sr: number, mode?: string) => {
  const tone = clamp(k.tone ?? k.v, 0, 1), centre = layerV(e, z.layer);
  if (mode === "off" || (mode !== "asis" && tone >= centre)) return Infinity;
  const t = mode !== "asis" ? 1 - Math.max(0, centre - tone) : tone;
  return Math.min(sr * 0.45, 350 + 17650 * t * t);
};
export const sampleGain = (e: SampleEntry, z: SampleZone, v: number) => e.normalized ? pianoVelocity(v) * db(-8 * Math.max(0, 0.6 - v)) : v <= 0 ? 0 : db(clamp(16 * (v - layerV(e, z.layer)), -6, 6));
/** A drum tuned to one note (a timpani in a drum lane) plays that note whatever the lane wrote, moved by octaves into what was recorded. */
export const pinnedPitch = (pitch: number, range: readonly [number, number] | readonly number[]) => { if (!Number.isFinite(pitch)) throw new Error(`a pinned pitch must be a note number, got ${pitch}`); let p = Math.round(pitch); while (p < range[0]) p += 12; while (p > range[1]) p -= 12; return p < range[0] ? range[0] : p; };
/** Nearest pitch, then nearest layer, then this note's seeded recording. State stays local to a render. */
export const sampleZones = (bank: SampleBank, keys: Played[], seed: number, pedal: PedalSpan[] = [], art?: "rel") => {
  const previous = new Map<string, SampleBank["zones"][number]>(), e = bank.entry, pool = bank.zones.filter(({ zone }) => zone.art === art);
  return keys.map((k, i) => {
    if (k.p < e.range[0] || k.p > e.range[1]) throw new Error(`${e.title}: note ${nameOf(k.p)} (${k.p}) outside range ${nameOf(e.range[0])}-${nameOf(e.range[1])} (${e.range.join("-")})`);
    let pitch = Infinity, distance = Infinity;
    for (const { zone: z } of pool) { const d = Math.abs(z.midi - k.p); if (d < distance || (d === distance && z.midi < pitch)) { pitch = z.midi; distance = d; } }
    const atPitch = pool.filter(({ zone }) => zone.midi === pitch), v = clamp(k.v, 0, 1);
    let layer = 0, delta = Infinity;
    for (const { zone: z } of atPitch) { const d = Math.abs(layerV(e, z.layer) - v); if (d < delta || (Math.abs(d - delta) < 1e-12 && z.layer > layer)) { layer = z.layer; delta = d; } }
    const down = !art && pedal.some(([a, b]) => k.t >= a && k.t < b), r = rng(k.vary?.seed ?? ((seed * 7919 + i * 104729 + k.p * 31) >>> 0));
    const pick = (layer: number) => {
      const sus = down ? bank.zones.filter(({ zone }) => zone.art === "sus" && zone.midi === pitch && zone.layer === layer) : [];
      const choices = (sus.length ? sus : atPitch.filter(({ zone }) => zone.layer === layer)).sort((a, b) => a.zone.rr - b.zone.rr);
      if (!choices.length) throw new Error(`${e.title}: no recording for ${nameOf(k.p)}`);
      const last = previous.get(`${k.p}:${choices[0].zone.art ?? "ordinary"}`), available = choices.length > 1 ? choices.filter((z) => z !== last) : choices;
      return available[Math.floor(r() * available.length)];
    };
    let z = pick(layer);
    // A near-silent recording must not lift its noise to the reference. Try a louder layer at this pitch.
    while (!art && bank.trim?.find((t) => t.file === z.zone.file)?.boostLimited) {
      const next = Math.min(...atPitch.filter(({ zone }) => zone.layer > z.zone.layer).map(({ zone }) => zone.layer));
      if (!Number.isFinite(next)) break; z = pick(next);
    }
    previous.set(`${k.p}:${z.zone.art ?? "ordinary"}`, z); return z;
  });
};

/** Blackman-windowed sinc, narrowed before any downsampling (pitch up OR a 24 kHz stem). */
const sincTable = (rate: number) => {
  const taps = 48, phases = 256, cut = 0.94 / Math.max(1, rate), table = new Float64Array(taps * (phases + 1));
  for (let p = 0; p <= phases; p++) {
    let sum = 0; for (let t = 0; t < taps; t++) { const d = t - taps / 2 + 1 - p / phases, x = Math.PI * d * cut, win = 0.42 + 0.5 * Math.cos(Math.PI * d / (taps / 2)) + 0.08 * Math.cos(2 * Math.PI * d / (taps / 2)), v = Math.abs(d) >= taps / 2 ? 0 : (Math.abs(x) < 1e-12 ? cut : cut * Math.sin(x) / x) * win; table[p * taps + t] = v; sum += v; }
    for (let t = 0; t < taps; t++) table[p * taps + t] /= sum;
  }
  return table;
};
const sincRead = (a: Float32Array, x: number, table: Float64Array) => {
  const i = Math.floor(x), ph = (x - i) * 256, p = Math.floor(ph), f = ph - p; let y = 0;
  for (let t = 0; t < 48; t++) { const j = i - 23 + t; if (j >= 0 && j < a.length) { const k = p * 48 + t; y += a[j] * (table[k] + f * (table[k + 48] - table[k])); } }
  return y;
};

export const samplerVoice = (bank: SampleBank, keys: Played[], pedal: PedalSpan[], sr: number, n: number, opts: Opts, seed: number) => {
  if (!Number.isFinite(sr) || sr <= 0 || !Number.isInteger(n) || n < 0) throw new Error("sampler: invalid sample rate or length");
  if (bank.entry.kind !== "struck") throw new Error(`${bank.entry.title}: ${bank.entry.zones.some((z) => !z.loop) ? "sustained zone without a loop" : "sustained banks are not supported in pack version 1"}`);
  const L = new Float32Array(n), R = new Float32Array(n), halo = new Float32Array(n), e = bank.entry;
  const sorted = keys.slice().sort((a, b) => a.t - b.t || a.p - b.p), usePedal = opts.pedal !== false, zones = sampleZones(bank, sorted, seed, usePedal ? pedal : []);
  const releases = e.damped && bank.zones.some(({ zone }) => zone.art === "rel") ? sampleZones(bank, sorted, seed + 401, [], "rel") : null;
  const id = "id" in bank ? String(bank.id) : "", grand = id.split(".")[0] === "piano" && !["upright", "honky"].includes(id.split(".")[1] ?? String(opts.variant));
  const pedalAt = (t: number) => usePedal && pedal.some(([a, b]) => t >= a && t < b);
  const pedalUpAfter = (t: number) => { for (const [a, b] of pedal) if (t >= a && t < b) return b; return t; };
  sorted.forEach((k, idx) => {
    const { zone: z, channels } = zones[idx], i0 = Math.round(k.t * sr); if (i0 >= n) return;
    const rate = (48000 / sr) * (z.unpitched ? 1 : Math.pow(2, (k.p - z.midi) / 12 + (k.vary?.cents ?? 0) / 1200));
    const table = rate !== 1 ? sincTable(rate) : null, v = clamp(k.v, 0, 1);
    // Keep the source's layer levels intact. A normalized source gets all its dynamics from this law.
    const gain = sampleGain(e, z, v) * db((k.vary?.db ?? 0) + (bank.trim?.find((t) => t.file === z.file)?.correctionDb ?? 0));
    const fc = sampleCutoff(e, z, k, sr, typeof opts.sampleFilter === "string" ? opts.sampleFilter : undefined), alpha = 1 - Math.exp(-2 * Math.PI * fc / sr);
    let damp = e.damped ? (pedalAt(k.off) ? pedalUpAfter(k.off) : k.off) : Infinity;
    if (grand && k.p >= 89) damp = Infinity; // the top grand keys have no dampers; vibes and uprights still stop
    const releaseAt = damp;
    if (e.damped) for (let j = idx + 1; j < sorted.length; j++) if (sorted[j].p === k.p && sorted[j].t > k.t) { damp = Math.min(damp, sorted[j].t + 0.004); break; }
    const tDamp = 0.08 + 0.45 * clamp((60 - k.p) / 36, 0, 1), dampI = Math.round((damp - k.t) * sr), dec = Math.exp(-6.91 / (tDamp * sr));
    const len = Math.min(n - i0, Math.ceil(z.frames / rate), damp === Infinity ? Infinity : dampI + Math.round(tDamp * 1.6 * sr) + 1), inPedal = e.damped && (pedalAt(k.t) || pedalAt(k.t + 0.25));
    const read = (a: Float32Array, i: number) => table ? sincRead(a, i * rate, table) : a[i];
    const rel = releases?.[idx], window = Math.max(1, Math.round(0.02 * sr)); let remaining = 0, count = 0;
    let l = 0, r = 0, env = 1;
    for (let i = 0; i < len; i++) {
      if (i >= dampI) env *= dec;
      l = fc === Infinity ? read(channels[0], i) : l + alpha * (read(channels[0], i) - l); r = channels.length === 1 ? l : fc === Infinity ? read(channels[1], i) : r + alpha * (read(channels[1], i) - r);
      const j = i0 + i; if (j < 0) continue;
      const a = l * gain * env, b = r * gain * env; L[j] += a; R[j] += b;
      if (rel && i >= Math.max(0, dampI - window) && i < dampI) { remaining += (a * a + b * b) * 0.5; count++; }
      if (inPedal) halo[j] += 0.5 * (a + b);
    }
    // Match the release noise to the string's last 20 ms, 15 dB below it. Never extend a dead string.
    const allowance = k.p === e.range[0] || k.p === e.range[1] ? 3 : 2;
    if (rel && Number.isFinite(releaseAt) && dampI > 0 && (releaseAt - k.t) * sr < z.frames / rate && count && (rel.zone.unpitched || Math.abs(k.p - rel.zone.midi + (k.vary?.cents ?? 0) / 100) <= allowance)) {
      const rz = rel.zone, rr = 48000 / sr * (rz.unpitched ? 1 : Math.pow(2, (k.p - rz.midi) / 12 + (k.vary?.cents ?? 0) / 1200)), rt = rr !== 1 ? sincTable(rr) : null;
      const readRel = (a: Float32Array, i: number) => rt ? sincRead(a, i * rr, rt) : a[i];
      const size = Math.ceil(rz.frames / rr), ref = Math.min(size, Math.round(0.5 * sr)); let power = 0;
      for (let i = 0; i < ref; i++) { const a = readRel(rel.channels[0], i), b = readRel(rel.channels[rz.channels - 1], i); power += (a * a + b * b) * 0.5; }
      const g = power > 0 ? Math.sqrt(remaining / count / (power / ref)) * db(-15) * Math.pow(dec, Math.round((releaseAt - damp) * sr)) : 0, start = Math.round(releaseAt * sr);
      for (let i = 0; i < size && start + i < n; i++) if (start + i >= 0) { L[start + i] += readRel(rel.channels[0], i) * g; R[start + i] += readRel(rel.channels[rz.channels - 1], i) * g; }
    }
  });
  return { L, R, halo };
};
