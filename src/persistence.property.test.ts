/**
 * Property-based tests for persistence round-trip serialisation.
 *
 * Property 5: Round-trip serialisation
 * Validates: Requirements 10.4
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import * as fc from 'fast-check';
import { saveState, loadState } from './persistence';
import type { AppState, InstrumentName } from './state';
import { INSTRUMENT_NAMES } from './state';

// Mock localStorage — same pattern as persistence.test.ts
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

// ---------------------------------------------------------------------------
// Arbitraries
// ---------------------------------------------------------------------------

/**
 * Per-instrument param ranges matching validateState's PARAM_RANGES.
 * Arbitraries must stay within these ranges so the round-trip holds after
 * validateState clamps values on load.
 */
const INSTRUMENT_PARAM_RANGES: Record<InstrumentName, Record<string, [number, number]>> = {
  kick:      { tune: [40, 200],     snap: [1, 80],       decay: [100, 3000], level: [0, 1] },
  snare:     { tune: [100, 400],    tone: [0, 1],        decay: [50, 800],   level: [0, 1] },
  clap:      { tone: [800, 4000],   decay: [20, 500],    level: [0, 1] },
  closedHat: { tune: [4000, 12000], decay: [10, 200],    level: [0, 1] },
  openHat:   { tune: [4000, 12000], decay: [100, 2000],  level: [0, 1] },
  tom:       { tune: [60, 500],     decay: [50, 1500],   level: [0, 1] },
  blip:      { tune: [200, 4000],   tone: [0, 1],        decay: [5, 300],    level: [0, 1] },
  acid:      { tune: [40, 400],     cutoff: [200, 8000], resonance: [0, 30], envAmt: [0, 1], decay: [50, 2000], level: [0, 1] },
};

/** Arbitrary for a single TrackState with exactly 16 boolean steps. */
function arbTrackState(instrument: InstrumentName) {
  const ranges = INSTRUMENT_PARAM_RANGES[instrument];
  const paramArbs = Object.fromEntries(
    Object.entries(ranges).map(([k, [min, max]]) => [
      k,
      fc.float({ min: Math.fround(min), max: Math.fround(max), noNaN: true }),
    ])
  );
  return fc.record({
    steps:  fc.array(fc.boolean(), { minLength: 16, maxLength: 16 }),
    params: fc.record(paramArbs),
    swing:  fc.double({ min: 0, max: 0.33, noNaN: true }),
    muted:  fc.boolean(),
    solo:   fc.boolean(),
    fx: fc.record({
      reverbMix:   fc.float({ min: 0, max: 1, noNaN: true }),
      delayMix:    fc.float({ min: 0, max: 1, noNaN: true }),
      delayTime:   fc.double({ min: 0.01, max: 1, noNaN: true }),
      distortion:  fc.float({ min: 0, max: 1, noNaN: true }),
    }),
  });
}

/** Arbitrary for a complete AppState. */
const arbAppState: fc.Arbitrary<AppState> = fc.record({
  bpm:          fc.integer({ min: 60, max: 200 }),
  masterVolume: fc.float({ min: 0, max: Math.fround(1), noNaN: true }),
  masterFx: fc.record({
    reverbMix:   fc.float({ min: 0, max: 1, noNaN: true }),
    delayMix:    fc.float({ min: 0, max: 1, noNaN: true }),
    delayTime:   fc.double({ min: 0.01, max: 1, noNaN: true }),
    distortion:  fc.float({ min: 0, max: 1, noNaN: true }),
  }),
  tracks: fc.record(
    Object.fromEntries(
      INSTRUMENT_NAMES.map((name) => [name, arbTrackState(name)])
    ) as Record<InstrumentName, fc.Arbitrary<AppState['tracks'][InstrumentName]>>
  ) as fc.Arbitrary<AppState['tracks']>,
});

// ---------------------------------------------------------------------------
// Property test
// ---------------------------------------------------------------------------

describe('persistence — property-based', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  it(
    /**
     * **Validates: Requirements 10.4**
     *
     * Property 5: Round-trip serialisation
     * For any valid AppState `s`, loadState(saveState(s)) === s (deep equality).
     */
    'Property 5: loadState(saveState(s)) deep-equals s for any AppState',
    () => {
      fc.assert(
        fc.property(arbAppState, (state) => {
          localStorageMock.clear();
          saveState(state);
          const loaded = loadState();
          // Deep equality — every field must round-trip through JSON
          expect(loaded).toEqual(state);
        }),
      );
    },
  );
});
