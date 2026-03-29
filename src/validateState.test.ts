import { describe, it, expect } from 'vitest';
import { validateState } from './validateState';
import { defaultState, INSTRUMENT_NAMES, STEP_COUNT } from './state';

describe('validateState', () => {
  it('returns defaultState for null', () => { expect(validateState(null)).toEqual(defaultState()); });
  it('returns defaultState for non-object', () => { expect(validateState(42)).toEqual(defaultState()); });

  it('clamps bpm to [60, 200]', () => {
    expect(validateState({ bpm: 10 }).bpm).toBe(60);
    expect(validateState({ bpm: 999 }).bpm).toBe(200);
    expect(validateState({ bpm: 130 }).bpm).toBe(130);
  });

  it('clamps masterVolume to [0, 1]', () => {
    expect(validateState({ masterVolume: -5 }).masterVolume).toBe(0);
    expect(validateState({ masterVolume: 2 }).masterVolume).toBe(1);
  });

  it('clamps per-track swing to [0, 0.33]', () => {
    const raw = { tracks: { kick: { steps: [], params: {}, fx: {}, muted: false, solo: false, swing: 1 } } };
    expect(validateState(raw).tracks.kick.swing).toBe(0.33);
  });

  it(`every track has exactly ${STEP_COUNT} steps`, () => {
    const result = validateState(defaultState());
    for (const name of INSTRUMENT_NAMES) expect(result.tracks[name].steps).toHaveLength(STEP_COUNT);
  });

  it('pads short steps array', () => {
    const raw = { tracks: { kick: { steps: [true, false], params: {} } } };
    const result = validateState(raw);
    expect(result.tracks.kick.steps).toHaveLength(STEP_COUNT);
    expect(result.tracks.kick.steps[0]).toBe(true);
  });

  it('truncates long steps array', () => {
    const raw = { tracks: { kick: { steps: Array(64).fill(true), params: {} } } };
    expect(validateState(raw).tracks.kick.steps).toHaveLength(STEP_COUNT);
  });

  it('clamps params to ranges', () => {
    const raw = { tracks: { kick: { steps: [], params: { tune: 0 } } } };
    expect(validateState(raw).tracks.kick.params.tune).toBe(40);
  });

  it('round-trips a valid state', () => {
    const state = defaultState();
    state.bpm = 145;
    state.tracks.kick.swing = 0.15;
    state.tracks.kick.steps[0] = true;
    expect(validateState(state)).toEqual(state);
  });
});

// Property-based tests
import * as fc from 'fast-check';
import type { InstrumentName } from './state';

const PARAM_RANGES: Record<InstrumentName, Record<string, [number, number]>> = {
  kick:      { tune: [40, 200],    snap: [1, 80],      decay: [100, 3000], level: [0, 1] },
  snare:     { tune: [100, 400],   tone: [0, 1],       decay: [50, 800],   level: [0, 1] },
  clap:      { tone: [800, 4000],  decay: [20, 500],   level: [0, 1] },
  closedHat: { tune: [4000, 12000], decay: [10, 200],  level: [0, 1] },
  openHat:   { tune: [4000, 12000], decay: [100, 2000], level: [0, 1] },
  tom:       { tune: [60, 500],    decay: [50, 1500],  level: [0, 1] },
  blip:      { tune: [200, 4000],  tone: [0, 1],       decay: [5, 300],    level: [0, 1] },
  blip2:     { tune: [200, 4000],  tone: [0, 1],       decay: [5, 300],    level: [0, 1] },
  stab:      { tune: [60, 800],    cutoff: [200, 6000], resonance: [0, 20], decay: [30, 800], level: [0, 1] },
};

const ALL_NAMES: InstrumentName[] = [
  'kick', 'snare', 'clap', 'closedHat', 'openHat', 'tom', 'blip', 'blip2', 'stab',
];

function arbitraryRawTrack(instrument: InstrumentName) {
  const paramArbs: Record<string, fc.Arbitrary<number>> = {};
  for (const key of Object.keys(PARAM_RANGES[instrument])) {
    paramArbs[key] = fc.float({ min: -1e6, max: 1e6, noNaN: true });
  }
  return fc.record({
    steps: fc.array(fc.boolean(), { minLength: 0, maxLength: 64 }),
    params: fc.record(paramArbs),
    swing: fc.float({ min: -1e6, max: 1e6, noNaN: true }),
  });
}

function arbitraryRawAppState() {
  const trackArbs: Record<string, fc.Arbitrary<unknown>> = {};
  for (const name of ALL_NAMES) trackArbs[name] = arbitraryRawTrack(name);
  return fc.record({
    bpm: fc.float({ min: -1e6, max: 1e6, noNaN: true }),
    masterVolume: fc.float({ min: -1e6, max: 1e6, noNaN: true }),
    tracks: fc.record(trackArbs),
  });
}

describe('validateState — PBT', () => {
  it('Property 1: all tracks have exactly STEP_COUNT steps', () => {
    fc.assert(fc.property(arbitraryRawAppState(), (raw) => {
      const result = validateState(raw);
      return ALL_NAMES.every((n) => result.tracks[n].steps.length === STEP_COUNT);
    }), { numRuns: 500 });
  });

  it('Property 2: BPM in [60, 200]', () => {
    fc.assert(fc.property(arbitraryRawAppState(), (raw) => {
      const { bpm } = validateState(raw);
      return bpm >= 60 && bpm <= 200;
    }), { numRuns: 500 });
  });

  it('Property 3: per-track swing in [0, 0.33]', () => {
    fc.assert(fc.property(arbitraryRawAppState(), (raw) => {
      const result = validateState(raw);
      return ALL_NAMES.every((n) => result.tracks[n].swing >= 0 && result.tracks[n].swing <= 0.33);
    }), { numRuns: 500 });
  });

  it('Property 4: all params within min/max', () => {
    fc.assert(fc.property(arbitraryRawAppState(), (raw) => {
      const result = validateState(raw);
      for (const name of ALL_NAMES) {
        const params = result.tracks[name].params;
        for (const [key, [min, max]] of Object.entries(PARAM_RANGES[name])) {
          const v = params[key];
          if (typeof v !== 'number' || v < min || v > max) return false;
        }
      }
      return true;
    }), { numRuns: 500 });
  });

  it('Property 7: level in [0, 1]', () => {
    fc.assert(fc.property(arbitraryRawAppState(), (raw) => {
      const result = validateState(raw);
      return ALL_NAMES.every((n) => {
        const l = result.tracks[n].params.level;
        return typeof l === 'number' && l >= 0 && l <= 1;
      });
    }), { numRuns: 500 });
  });
});
