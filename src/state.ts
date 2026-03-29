export const STEP_COUNT = 32;

export type InstrumentName =
  | 'kick'
  | 'snare'
  | 'clap'
  | 'closedHat'
  | 'openHat'
  | 'tom'
  | 'blip'
  | 'blip2'
  | 'stab';

export const INSTRUMENT_NAMES: InstrumentName[] = [
  'kick', 'snare', 'clap', 'closedHat', 'openHat', 'tom', 'blip', 'blip2', 'stab',
];

export interface TrackState {
  steps: boolean[];                 // length === STEP_COUNT
  params: Record<string, number>;
  fx: FxState;
  muted: boolean;
  solo: boolean;
  swing: number;                    // 0–0.33
}

export interface FxState {
  reverb: number;       // 0–1
  delay: number;        // 0–1
  distortion: number;   // 0–1
}

export interface AppState {
  bpm: number;           // 60–200, default 130
  masterVolume: number;  // 0–1, default 0.8
  tracks: Record<InstrumentName, TrackState>;
}

const DEFAULT_FX: FxState = { reverb: 0, delay: 0, distortion: 0 };

const DEFAULT_PARAMS: Record<InstrumentName, Record<string, number>> = {
  kick:      { tune: 80, snap: 10, decay: 800, level: 0.9 },
  snare:     { tune: 200, tone: 0.5, decay: 200, level: 0.8 },
  clap:      { tone: 1200, decay: 120, level: 0.75 },
  closedHat: { tune: 8000, decay: 60, level: 0.7 },
  openHat:   { tune: 7000, decay: 600, level: 0.65 },
  tom:       { tune: 120, decay: 400, level: 0.75 },
  blip:      { tune: 800, tone: 0.3, decay: 80, level: 0.7 },
  blip2:     { tune: 1600, tone: 0.6, decay: 40, level: 0.65 },
  stab:      { tune: 220, cutoff: 1200, resonance: 8, decay: 150, level: 0.7 },
};

function defaultTrack(instrument: InstrumentName): TrackState {
  return {
    steps: Array(STEP_COUNT).fill(false),
    params: { ...DEFAULT_PARAMS[instrument] },
    fx: { ...DEFAULT_FX },
    muted: false,
    solo: false,
    swing: 0,
  };
}

export function defaultState(): AppState {
  const tracks = {} as Record<InstrumentName, TrackState>;
  for (const name of INSTRUMENT_NAMES) {
    tracks[name] = defaultTrack(name);
  }
  return { bpm: 130, masterVolume: 0.8, tracks };
}
