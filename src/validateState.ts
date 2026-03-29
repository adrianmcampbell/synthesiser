import {
  defaultState, STEP_COUNT, INSTRUMENT_NAMES,
  type AppState, type InstrumentName, type TrackState,
} from './state';

function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v));
}

const PARAM_RANGES: Record<InstrumentName, Record<string, [number, number]>> = {
  kick:      { tune: [40, 200],    snap: [1, 80],      decay: [100, 3000], level: [0, 1] },
  snare:     { tune: [100, 400],   tone: [0, 1],       decay: [50, 800],   level: [0, 1] },
  clap:      { tone: [800, 4000],  decay: [20, 500],   level: [0, 1] },
  closedHat: { tune: [4000, 12000], decay: [10, 200],  level: [0, 1] },
  openHat:   { tune: [4000, 12000], decay: [100, 2000], level: [0, 1] },
  tom:       { tune: [60, 500],    decay: [50, 1500],  level: [0, 1] },
  blip:      { tune: [200, 4000],  tone: [0, 1],       decay: [5, 300],    level: [0, 1] },
  blip2:     { tune: [200, 4000],  tone: [0, 1],       decay: [5, 300],    level: [0, 1] },
  blip3:     { tune: [100, 3000],  decay: [10, 500],   feedback: [0, 1],   level: [0, 1] },
};

function validateTrack(raw: unknown, instrument: InstrumentName): TrackState {
  const defaults = defaultState().tracks[instrument];
  const ranges = PARAM_RANGES[instrument];

  let steps: boolean[] = Array(STEP_COUNT).fill(false);
  if (raw !== null && typeof raw === 'object' && Array.isArray((raw as Record<string, unknown>).steps)) {
    const rawSteps = (raw as Record<string, unknown>).steps as unknown[];
    const coerced = rawSteps.slice(0, STEP_COUNT).map((s) => Boolean(s));
    while (coerced.length < STEP_COUNT) coerced.push(false);
    steps = coerced;
  }

  const params: Record<string, number> = {};
  const rawParams = raw !== null && typeof raw === 'object'
    ? ((raw as Record<string, unknown>).params as Record<string, unknown> | undefined) : undefined;
  for (const [key, [min, max]] of Object.entries(ranges)) {
    const v = rawParams?.[key];
    params[key] = typeof v === 'number' && isFinite(v) ? clamp(v, min, max) : defaults.params[key];
  }

  const rawMuted = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>).muted : undefined;
  const muted = typeof rawMuted === 'boolean' ? rawMuted : false;

  const rawSolo = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>).solo : undefined;
  const solo = typeof rawSolo === 'boolean' ? rawSolo : false;

  const rawSwing = raw !== null && typeof raw === 'object' ? (raw as Record<string, unknown>).swing : undefined;
  const swing = typeof rawSwing === 'number' && isFinite(rawSwing) ? clamp(rawSwing, 0, 0.33) : 0;

  return { steps, params, muted, solo, swing };
}

export function validateState(raw: unknown): AppState {
  const defaults = defaultState();
  if (raw === null || typeof raw !== 'object') return defaults;
  const obj = raw as Record<string, unknown>;

  const bpm = typeof obj.bpm === 'number' && isFinite(obj.bpm) ? clamp(obj.bpm, 60, 200) : defaults.bpm;
  const masterVolume = typeof obj.masterVolume === 'number' && isFinite(obj.masterVolume) ? clamp(obj.masterVolume, 0, 1) : defaults.masterVolume;

  const rawTracks = obj.tracks !== null && typeof obj.tracks === 'object' ? (obj.tracks as Record<string, unknown>) : {};
  const tracks = {} as AppState['tracks'];
  for (const name of INSTRUMENT_NAMES) tracks[name] = validateTrack(rawTracks[name], name);

  return { bpm, masterVolume, tracks };
}
