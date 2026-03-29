export const STEP_COUNT = 32;

export type InstrumentName =
  | 'kick' | 'snare' | 'clap' | 'closedHat' | 'openHat'
  | 'tom' | 'blip' | 'blip2' | 'blip3';

export const INSTRUMENT_NAMES: InstrumentName[] = [
  'kick', 'snare', 'clap', 'closedHat', 'openHat', 'tom', 'blip', 'blip2', 'blip3',
];

export interface TrackState {
  steps: boolean[];
  params: Record<string, number>;
  muted: boolean;
  solo: boolean;
  swing: number;
}

export interface AppState {
  bpm: number;
  masterVolume: number;
  tracks: Record<InstrumentName, TrackState>;
}

const DEFAULT_PARAMS: Record<InstrumentName, Record<string, number>> = {
  kick:      { tune: 80, snap: 10, decay: 800, level: 0.9 },
  snare:     { tune: 200, tone: 0.5, decay: 200, level: 0.8 },
  clap:      { tone: 1200, decay: 120, level: 0.75 },
  closedHat: { tune: 8000, decay: 60, level: 0.7 },
  openHat:   { tune: 7000, decay: 600, level: 0.65 },
  tom:       { tune: 120, decay: 400, level: 0.75 },
  blip:      { tune: 800, tone: 0.3, decay: 80, level: 0.7 },
  blip2:     { tune: 1600, tone: 0.6, decay: 40, level: 0.65 },
  blip3:     { tune: 440, decay: 60, feedback: 0.5, level: 0.6 },
};

function defaultTrack(instrument: InstrumentName): TrackState {
  return {
    steps: Array(STEP_COUNT).fill(false),
    params: { ...DEFAULT_PARAMS[instrument] },
    muted: false,
    solo: false,
    swing: 0,
  };
}

export function defaultState(): AppState {
  const tracks = {} as Record<InstrumentName, TrackState>;
  for (const name of INSTRUMENT_NAMES) tracks[name] = defaultTrack(name);
  return { bpm: 130, masterVolume: 0.8, tracks };
}
