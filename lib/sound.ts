// Sound manager for (Em)Powered Play.
//
// Uses Web Audio synthesis so sounds work without any MP3 assets. If we ever
// want richer/licensed sounds, this module is the single place to swap in
// pre-loaded audio buffers: callers just invoke `playSound(name)` and don't
// care about the source.
//
// Mute preference is persisted to localStorage under a stable key; subscribers
// (the BrandBar mute toggle) re-render on mute change via `subscribe`.

type SoundName =
  | "click"
  | "clue-sent"
  | "photo"
  | "lego-detected"
  | "timer-warning"
  | "timer-expired"
  | "crisis-reveal"
  | "power-dealt"
  | "map-rebuilt"
  | "vote-cast"
  | "complete-fanfare";

const MUTE_KEY = "empowered-play-mute";

let ctx: AudioContext | null = null;
let muted = false;
const listeners = new Set<() => void>();

// Read the persisted mute flag once on module load. Wrapped because
// localStorage can throw (Safari private mode, SSR).
if (typeof window !== "undefined") {
  try {
    muted = window.localStorage.getItem(MUTE_KEY) === "1";
  } catch {
    muted = false;
  }
}

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (ctx) return ctx;
  try {
    const Ctor =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!Ctor) return null;
    ctx = new Ctor();
  } catch {
    return null;
  }
  return ctx;
}

// Call this from a user gesture to unlock audio on iOS/Safari. Safe to call
// repeatedly. Invoked lazily from `playSound` so most callers don't need to
// think about it.
export function unlockAudio() {
  const c = getCtx();
  if (c && c.state === "suspended") {
    c.resume().catch(() => {});
  }
}

export function isMuted(): boolean {
  return muted;
}

export function setMuted(value: boolean) {
  muted = value;
  try {
    if (typeof window !== "undefined") {
      window.localStorage.setItem(MUTE_KEY, value ? "1" : "0");
    }
  } catch {
    // storage unavailable: we still keep the in-memory flag
  }
  listeners.forEach((fn) => {
    try { fn(); } catch {}
  });
}

export function subscribe(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

// Single-note envelope helper. Ramps amplitude up from 0 → peak → 0 so we don't
// get the click artifacts a raw start/stop would produce.
function tone(
  c: AudioContext,
  freq: number,
  durationMs: number,
  opts: {
    type?: OscillatorType;
    gain?: number;
    attackMs?: number;
    releaseMs?: number;
    delayMs?: number;
  } = {}
) {
  const type = opts.type ?? "sine";
  const gain = opts.gain ?? 0.12;
  const attack = (opts.attackMs ?? 8) / 1000;
  const release = (opts.releaseMs ?? 80) / 1000;
  const delay = (opts.delayMs ?? 0) / 1000;
  const t0 = c.currentTime + delay;
  const hold = durationMs / 1000;
  const osc = c.createOscillator();
  const amp = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  amp.gain.setValueAtTime(0, t0);
  amp.gain.linearRampToValueAtTime(gain, t0 + attack);
  amp.gain.linearRampToValueAtTime(gain * 0.9, t0 + attack + hold);
  amp.gain.linearRampToValueAtTime(0, t0 + attack + hold + release);
  osc.connect(amp);
  amp.connect(c.destination);
  osc.start(t0);
  osc.stop(t0 + attack + hold + release + 0.02);
}

export function playSound(name: SoundName) {
  if (muted) return;
  const c = getCtx();
  if (!c) return;
  if (c.state === "suspended") {
    c.resume().catch(() => {});
  }
  switch (name) {
    case "click":
      tone(c, 800, 30, { type: "sine", gain: 0.08 });
      break;
    case "clue-sent":
      // Ascending C-E-G triad, feels like a confirm chime.
      tone(c, 523, 70, { type: "sine", gain: 0.11 });
      tone(c, 659, 70, { type: "sine", gain: 0.11, delayMs: 70 });
      tone(c, 784, 120, { type: "sine", gain: 0.13, delayMs: 140 });
      break;
    case "photo":
      // Two fast square-wave clicks: a camera shutter.
      tone(c, 900, 18, { type: "square", gain: 0.08, attackMs: 2, releaseMs: 30 });
      tone(c, 620, 24, { type: "square", gain: 0.08, attackMs: 2, releaseMs: 40, delayMs: 40 });
      break;
    case "lego-detected":
      // Happy arpeggio to confirm the model liked the build photo.
      tone(c, 659, 80, { type: "triangle", gain: 0.13 });
      tone(c, 784, 80, { type: "triangle", gain: 0.13, delayMs: 85 });
      tone(c, 1047, 180, { type: "triangle", gain: 0.15, delayMs: 170, releaseMs: 220 });
      break;
    case "timer-warning":
      // Single pulse: call multiple times for a rhythm (e.g. each second).
      tone(c, 880, 90, { type: "sine", gain: 0.1 });
      break;
    case "timer-expired":
      // Low gong, slow decay.
      tone(c, 220, 400, { type: "sine", gain: 0.18, releaseMs: 600 });
      tone(c, 165, 500, { type: "sine", gain: 0.13, releaseMs: 700, delayMs: 40 });
      break;
    case "crisis-reveal":
      // Ominous sawtooth drone pair, slow attack, low register.
      tone(c, 110, 500, { type: "sawtooth", gain: 0.12, attackMs: 120, releaseMs: 600 });
      tone(c, 138, 600, { type: "sawtooth", gain: 0.1, attackMs: 180, releaseMs: 700, delayMs: 120 });
      break;
    case "power-dealt":
      // Sparkling shimmer: descending then ascending triangle flourish.
      tone(c, 1568, 60, { type: "triangle", gain: 0.08, attackMs: 4, releaseMs: 90 });
      tone(c, 1319, 60, { type: "triangle", gain: 0.08, delayMs: 60, attackMs: 4, releaseMs: 90 });
      tone(c, 1760, 90, { type: "triangle", gain: 0.1, delayMs: 130, attackMs: 4, releaseMs: 140 });
      break;
    case "map-rebuilt":
      // Orchestral hit ramp: major third stacked with fundamental.
      tone(c, 262, 220, { type: "sine", gain: 0.18, attackMs: 20, releaseMs: 260 });
      tone(c, 330, 220, { type: "sine", gain: 0.14, attackMs: 20, releaseMs: 260 });
      tone(c, 392, 300, { type: "sine", gain: 0.12, attackMs: 20, releaseMs: 320, delayMs: 60 });
      tone(c, 523, 400, { type: "sine", gain: 0.1, attackMs: 30, releaseMs: 500, delayMs: 160 });
      break;
    case "vote-cast":
      // Soft single chime, high sine.
      tone(c, 1047, 60, { type: "sine", gain: 0.09, attackMs: 4, releaseMs: 120 });
      break;
    case "complete-fanfare":
      // Triumphant triad → higher octave hit.
      tone(c, 392, 140, { type: "triangle", gain: 0.12, releaseMs: 180 });
      tone(c, 523, 140, { type: "triangle", gain: 0.12, releaseMs: 180, delayMs: 140 });
      tone(c, 659, 220, { type: "triangle", gain: 0.14, releaseMs: 260, delayMs: 280 });
      tone(c, 784, 400, { type: "sine", gain: 0.12, attackMs: 20, releaseMs: 500, delayMs: 480 });
      break;
  }
}
