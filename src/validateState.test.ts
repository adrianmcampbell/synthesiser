import { describe, it, expect } from 'vitest';
import { validateState } from './validateState';
import { defaultState, INSTRUMENT_NAMES } from './state';

describe('validateState', () => {
  describe('top-level fallbacks', () => {
    it('returns defaultState for null input', () => {
      expect(validateState(null)).toEqual(defaultState());
    });

    it('returns defaultState for non-object input', () => {
      expect(validateState('string')).toEqual(defaultState());
      expect(validateState(42)).toEqual(defaultState());
      expect(validateState([])).toEqual(defaultState());
    });

    it('returns defaultState for empty object', () => {
      const result = validateState({});
      const def = defaultState();
      expect(result.bpm).toBe(def.bpm);
      expect(result.masterVolume).toBe(def.masterVolume);
    });
  });

  describe('bpm clamping', () => {
    it('passes through a valid bpm', () => {
      expect(validateState({ bpm: 130 }).bpm).toBe(130);
    });

    it('clamps bpm below 60 to 60', () => {
      expect(validateState({ bpm: 10 }).bpm).toBe(60);
    });

    it('clamps bpm above 200 to 200', () => {
      expect(validateState({ bpm: 999 }).bpm).toBe(200);
    });

    it('falls back to default bpm for non-number', () => {
      expect(validateState({ bpm: 'fast' }).bpm).toBe(defaultState().bpm);
    });
  });

  describe('swing clamping', () => {
    it('passes through a valid swing', () => {
      expect(validateState({ tracks: { kick: { steps: [], params: {}, fx: {}, muted: false, solo: false, swing: 0.2 } } }).tracks.kick.swing).toBe(0.2);
    });

    it('clamps swing below 0 to 0', () => {
      expect(validateState({ tracks: { kick: { steps: [], params: {}, fx: {}, muted: false, solo: false, swing: -1 } } }).tracks.kick.swing).toBe(0);
    });

    it('clamps swing above 0.33 to 0.33', () => {
      expect(validateState({ tracks: { kick: { steps: [], params: {}, fx: {}, muted: false, solo: false, swing: 1 } } }).tracks.kick.swing).toBe(0.33);
    });
  });

  describe('masterVolume clamping', () => {
    it('passes through a valid masterVolume', () => {
      expect(validateState({ masterVolume: 0.5 }).masterVolume).toBe(0.5);
    });

    it('clamps masterVolume below 0 to 0', () => {
      expect(validateState({ masterVolume: -5 }).masterVolume).toBe(0);
    });

    it('clamps masterVolume above 1 to 1', () => {
      expect(validateState({ masterVolume: 2 }).masterVolume).toBe(1);
    });
  });

  describe('track steps', () => {
    it('every track has exactly 16 steps for a valid state', () => {
      const result = validateState(defaultState());
      for (const name of INSTRUMENT_NAMES) {
        expect(result.tracks[name].steps).toHaveLength(16);
      }
    });

    it('pads a short steps array with false', () => {
      const raw = { tracks: { kick: { steps: [true, false], params: {} } } };
      const result = validateState(raw);
      expect(result.tracks.kick.steps).toHaveLength(16);
      expect(result.tracks.kick.steps[0]).toBe(true);
      expect(result.tracks.kick.steps[2]).toBe(false);
    });

    it('truncates a long steps array to 16', () => {
      const longSteps = Array(32).fill(true);
      const raw = { tracks: { kick: { steps: longSteps, params: {} } } };
      const result = validateState(raw);
      expect(result.tracks.kick.steps).toHaveLength(16);
    });

    it('uses 16 false steps when track is missing', () => {
      const result = validateState({ tracks: {} });
      for (const name of INSTRUMENT_NAMES) {
        expect(result.tracks[name].steps).toHaveLength(16);
        expect(result.tracks[name].steps.every((s) => s === false)).toBe(true);
      }
    });
  });

  describe('param clamping', () => {
    it('clamps kick tune below min to 40', () => {
      const raw = { tracks: { kick: { steps: [], params: { tune: 0, snap: 10, decay: 800, level: 0.9 } } } };
      expect(validateState(raw).tracks.kick.params.tune).toBe(40);
    });

    it('clamps kick tune above max to 200', () => {
      const raw = { tracks: { kick: { steps: [], params: { tune: 999, snap: 10, decay: 800, level: 0.9 } } } };
      expect(validateState(raw).tracks.kick.params.tune).toBe(200);
    });

    it('clamps level above 1 to 1', () => {
      const raw = { tracks: { snare: { steps: [], params: { tune: 200, tone: 0.5, decay: 200, level: 5 } } } };
      expect(validateState(raw).tracks.snare.params.level).toBe(1);
    });

    it('falls back to default param when value is missing', () => {
      const raw = { tracks: { kick: { steps: [], params: {} } } };
      const result = validateState(raw);
      expect(result.tracks.kick.params.tune).toBe(defaultState().tracks.kick.params.tune);
      expect(result.tracks.kick.params.decay).toBe(defaultState().tracks.kick.params.decay);
    });

    it('falls back to default param when value is non-numeric', () => {
      const raw = { tracks: { kick: { steps: [], params: { tune: 'loud', snap: 10, decay: 800, level: 0.9 } } } };
      expect(validateState(raw).tracks.kick.params.tune).toBe(defaultState().tracks.kick.params.tune);
    });

    it('passes through valid params unchanged', () => {
      const state = defaultState();
      const result = validateState(state);
      expect(result.tracks.kick.params).toEqual(state.tracks.kick.params);
    });
  });

  describe('full round-trip with valid state', () => {
    it('returns an equivalent state when given a valid AppState', () => {
      const state = defaultState();
      state.bpm = 145;
      state.tracks.kick.swing = 0.15;
      state.tracks.kick.steps[0] = true;
      state.tracks.kick.params.decay = 1200;
      expect(validateState(state)).toEqual(state);
    });
  });
});

// ---------------------------------------------------------------------------
// Property-based tests (fast-check)
// Validates: Requirements 1.1, 1.2, 1.8, 10.4
// ---------------------------------------------------------------------------

import * as fc from 'fast-check';
import type { InstrumentName } from './state';

/** Per-instrument parameter ranges mirrored from validateState.ts */
const PARAM_RANGES: Record<InstrumentName, Record<string, [number, number]>> = {
  kick:      { tune: [40, 200],    snap: [1, 80],      decay: [100, 3000], level: [0, 1] },
  snare:     { tune: [100, 400],   tone: [0, 1],       decay: [50, 800],   level: [0, 1] },
  clap:      { tone: [800, 4000],  decay: [20, 500],   level: [0, 1] },
  closedHat: { tune: [4000, 12000], decay: [10, 200],  level: [0, 1] },
  openHat:   { tune: [4000, 12000], decay: [100, 2000], level: [0, 1] },
  tom:       { tune: [60, 500],    decay: [50, 1500],  level: [0, 1] },
  blip:      { tune: [200, 4000],  tone: [0, 1],       decay: [5, 300],    level: [0, 1] },
  acid:      { tune: [40, 400],    cutoff: [200, 8000], resonance: [0, 30], envAmt: [0, 1], decay: [50, 2000], level: [0, 1] },
};

const INSTRUMENT_NAMES_LIST: InstrumentName[] = [
  'kick', 'snare', 'clap', 'closedHat', 'openHat', 'tom', 'blip', 'acid',
];

/** Arbitrary for a single track with potentially out-of-range values. */
function arbitraryRawTrack(instrument: InstrumentName) {
  const paramArbs: Record<string, fc.Arbitrary<number>> = {};
  for (const key of Object.keys(PARAM_RANGES[instrument])) {
    // Use a wide float range to exercise clamping
    paramArbs[key] = fc.float({ min: -1e6, max: 1e6, noNaN: true });
  }
  return fc.record({
    steps: fc.array(fc.boolean(), { minLength: 0, maxLength: 32 }),
    params: fc.record(paramArbs),
    swing: fc.float({ min: -1e6, max: 1e6, noNaN: true }),
  });
}

/** Arbitrary for a full raw AppState-like object with potentially out-of-range values. */
function arbitraryRawAppState() {
  const trackArbs: Record<string, fc.Arbitrary<unknown>> = {};
  for (const name of INSTRUMENT_NAMES_LIST) {
    trackArbs[name] = arbitraryRawTrack(name);
  }
  return fc.record({
    bpm:          fc.float({ min: -1e6, max: 1e6, noNaN: true }),
    masterVolume: fc.float({ min: -1e6, max: 1e6, noNaN: true }),
    tracks:       fc.record(trackArbs),
  });
}

describe('validateState — property-based tests', () => {
  /**
   * Property 1: Step count invariant
   * For any loaded state, all tracks have exactly 16 steps.
   * Validates: Requirements 1.1
   */
  it('Property 1: all tracks have exactly 16 steps after validateState', () => {
    fc.assert(
      fc.property(arbitraryRawAppState(), (raw) => {
        const result = validateState(raw);
        for (const name of INSTRUMENT_NAMES_LIST) {
          if (result.tracks[name].steps.length !== 16) return false;
        }
        return true;
      }),
      { numRuns: 500 },
    );
  });

  /**
   * Property 2: BPM range invariant
   * BPM always in [60, 200] after validateState.
   * Validates: Requirements 1.2
   */
  it('Property 2: BPM is always in [60, 200] after validateState', () => {
    fc.assert(
      fc.property(arbitraryRawAppState(), (raw) => {
        const { bpm } = validateState(raw);
        return bpm >= 60 && bpm <= 200;
      }),
      { numRuns: 500 },
    );
  });

  /**
   * Property 3: Swing range invariant
   * Per-track swing always in [0, 0.33] after validateState.
   * Validates: Requirements 1.8
   */
  it('Property 3: swing is always in [0, 0.33] for every track after validateState', () => {
    fc.assert(
      fc.property(arbitraryRawAppState(), (raw) => {
        const result = validateState(raw);
        for (const name of INSTRUMENT_NAMES_LIST) {
          const { swing } = result.tracks[name];
          if (swing < 0 || swing > 0.33) return false;
        }
        return true;
      }),
      { numRuns: 500 },
    );
  });

  /**
   * Property 4: Parameter range invariant
   * All param values within configured min/max after validateState.
   * Validates: Requirements 10.4
   */
  it('Property 4: all params are within their configured min/max after validateState', () => {
    fc.assert(
      fc.property(arbitraryRawAppState(), (raw) => {
        const result = validateState(raw);
        for (const name of INSTRUMENT_NAMES_LIST) {
          const params = result.tracks[name].params;
          const ranges = PARAM_RANGES[name];
          for (const [key, [min, max]] of Object.entries(ranges)) {
            const val = params[key];
            if (typeof val !== 'number' || val < min || val > max) return false;
          }
        }
        return true;
      }),
      { numRuns: 500 },
    );
  });

  /**
   * Property 7: Level parameter normalisation
   * Level always in [0, 1] for every instrument after validateState.
   * Validates: Requirements 1.1
   */
  it('Property 7: level param is always in [0, 1] for every instrument after validateState', () => {
    fc.assert(
      fc.property(arbitraryRawAppState(), (raw) => {
        const result = validateState(raw);
        for (const name of INSTRUMENT_NAMES_LIST) {
          const level = result.tracks[name].params.level;
          if (typeof level !== 'number' || level < 0 || level > 1) return false;
        }
        return true;
      }),
      { numRuns: 500 },
    );
  });
});
