export type InstrumentName =
  | 'kick'
  | 'snare'
  | 'clap'
  | 'closedHat'
  | 'openHat'
  | 'tom'
  | 'blip'
  | 'acid';

export const INSTRUMENT_NAMES: InstrumentName[] = [
  'kick',
  'snare',
  'clap',
  'closedHat',
  'openHat',
  'tom',
  'blip',
  'acid',
];

export interface TrackState {
  steps: boolean[];                 // length === 16
  params: Record<string, number>;   // synthesis params
  fx: FxState;                      // per-track effects
  muted: boolean;
  solo: boolean;
  swing: number;                    // 0–0.33, per-track swing
}

export interface FxState {
  reverbMix: number;    // 0–1
  delayMix: number;     // 0–1
  delayTime: number;    // 0.01–1 s
  distortion: number;   // 0–1
}

export interface MasterFxState {
  reverbMix: number;
  delayMix: number;
  delayTime: number;
  distortion: number;
}

export interface AppState {
  bpm: number;           // 60–200, default 130
  masterVolume: number;  // 0–1, default 0.8
  masterFx: MasterFxState;
  tracks: Record<InstrumentName, TrackState>;
}

const DEFAULT_FX: FxState = {
  reverbMix: 0,
  delayMix: 0,
  delayTime: 0.25,
  distortion: 0,
};

const DEFAULT_MASTER_FX: MasterFxState = {
  reverbMix: 0,
  delayMix: 0,
  delayTime: 0.25,
  distortion: 0,
};

/** Default synthesis parameters per instrument. */
const DEFAULT_PARAMS: Record<InstrumentName, Record<string, number>> = {
  kick:      { tune: 80, snap: 10, decay: 800, level: 0.9 },
  snare:     { tune: 200, tone: 0.5, decay: 200, level: 0.8 },
  clap:      { tone: 1200, decay: 120, level: 0.75 },
  closedHat: { tune: 8000, decay: 60, level: 0.7 },
  openHat:   { tune: 7000, decay: 600, level: 0.65 },
  tom:       { tune: 120, decay: 400, level: 0.75 },
  blip:      { tune: 800, tone: 0.3, decay: 80, level: 0.7 },
  acid:      { tune: 110, cutoff: 800, resonance: 15, envAmt: 0.7, decay: 300, level: 0.8 },
};

function defaultTrack(instrument: InstrumentName): TrackState {
  return {
    steps: Array(16).fill(false),
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
  return {
    bpm: 130,
    masterVolume: 0.8,
    masterFx: { ...DEFAULT_MASTER_FX },
    tracks,
  };
}
