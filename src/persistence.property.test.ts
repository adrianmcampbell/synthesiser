import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { saveState, loadState } from './persistence';
import type { AppState, InstrumentName } from './state';
import { INSTRUMENT_NAMES, STEP_COUNT } from './state';

const localStorageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: vi.fn((key: string) => store[key] ?? null),
    setItem: vi.fn((key: string, value: string) => { store[key] = value; }),
    removeItem: vi.fn((key: string) => { delete store[key]; }),
    clear: vi.fn(() => { store = {}; }),
  };
})();
vi.stubGlobal('localStorage', localStorageMock);

const RANGES: Record<InstrumentName, Record<string, [number, number]>> = {
  kick:      { tune: [40, 200],    snap: [1, 80],      decay: [100, 3000], level: [0, 1] },
  snare:     { tune: [100, 400],   tone: [0, 1],       decay: [50, 800],   level: [0, 1] },
  clap:      { tone: [800, 4000],  decay: [20, 500],   level: [0, 1] },
  closedHat: { tune: [4000, 12000], decay: [10, 200],  level: [0, 1] },
  openHat:   { tune: [4000, 12000], decay: [100, 2000], level: [0, 1] },
  tom:       { tune: [60, 500],    decay: [50, 1500],  level: [0, 1] },
  blip:      { tune: [200, 4000],  tone: [0, 1],       decay: [5, 300],    level: [0, 1] },
  blip2:     { tune: [200, 4000],  tone: [0, 1],       decay: [5, 300],    level: [0, 1] },
  blip3:     { tune: [100, 3000],  decay: [10, 500],   feedback: [0, 1],   level: [0, 1] },
  stab:      { tune: [40, 400],    cutoff: [100, 4000], resonance: [0, 25], decay: [50, 1500], level: [0, 1] },
};

function arbTrack(inst: InstrumentName) {
  const p = Object.fromEntries(Object.entries(RANGES[inst]).map(([k, [min, max]]) => [k, fc.float({ min: Math.fround(min), max: Math.fround(max), noNaN: true })]));
  return fc.record({
    steps: fc.array(fc.boolean(), { minLength: STEP_COUNT, maxLength: STEP_COUNT }),
    params: fc.record(p),
    swing: fc.double({ min: 0, max: 0.33, noNaN: true }),
    muted: fc.boolean(),
    solo: fc.boolean(),
  });
}

const arbAppState: fc.Arbitrary<AppState> = fc.record({
  bpm: fc.integer({ min: 60, max: 200 }),
  masterVolume: fc.float({ min: 0, max: 1, noNaN: true }),
  tracks: fc.record(
    Object.fromEntries(INSTRUMENT_NAMES.map((n) => [n, arbTrack(n)])) as Record<InstrumentName, fc.Arbitrary<AppState['tracks'][InstrumentName]>>
  ) as fc.Arbitrary<AppState['tracks']>,
});

describe('persistence — PBT', () => {
  beforeEach(() => { localStorageMock.clear(); vi.clearAllMocks(); });
  it('round-trip serialisation', () => {
    fc.assert(fc.property(arbAppState, (state) => { localStorageMock.clear(); saveState(state); expect(loadState()).toEqual(state); }));
  });
});
