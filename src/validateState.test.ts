import { describe, it, expect } from 'vitest';
import { validateState } from './validateState';
import { defaultState, INSTRUMENT_NAMES, STEP_COUNT } from './state';

describe('validateState', () => {
  it('returns defaultState for null', () => { expect(validateState(null)).toEqual(defaultState()); });
  it('clamps bpm', () => { expect(validateState({ bpm: 10 }).bpm).toBe(60); expect(validateState({ bpm: 999 }).bpm).toBe(200); });
  it('clamps masterVolume', () => { expect(validateState({ masterVolume: -5 }).masterVolume).toBe(0); });

  it(`every track has ${STEP_COUNT} steps`, () => {
    for (const name of INSTRUMENT_NAMES) expect(validateState(defaultState()).tracks[name].steps).toHaveLength(STEP_COUNT);
  });

  it('clamps params', () => {
    expect(validateState({ tracks: { kick: { steps: [], params: { tune: 0 } } } }).tracks.kick.params.tune).toBe(40);
  });

  it('round-trips valid state', () => {
    const state = defaultState();
    state.bpm = 145;
    state.tracks.kick.steps[0] = true;
    expect(validateState(state)).toEqual(state);
  });
});

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
  blip3:     { tune: [100, 3000],  decay: [10, 500],   feedback: [0, 1],   level: [0, 1] },
  stab:      { tune: [40, 400],    cutoff: [100, 4000], resonance: [0, 25], decay: [50, 1500], level: [0, 1] },
};

const ALL: InstrumentName[] = ['kick','snare','clap','closedHat','openHat','tom','blip','blip2','blip3','stab'];

function arbTrack(inst: InstrumentName) {
  const p: Record<string, fc.Arbitrary<number>> = {};
  for (const k of Object.keys(PARAM_RANGES[inst])) p[k] = fc.float({ min: -1e6, max: 1e6, noNaN: true });
  return fc.record({ steps: fc.array(fc.boolean(), { minLength: 0, maxLength: 64 }), params: fc.record(p), swing: fc.float({ min: -1e6, max: 1e6, noNaN: true }) });
}

function arbState() {
  const t: Record<string, fc.Arbitrary<unknown>> = {};
  for (const n of ALL) t[n] = arbTrack(n);
  return fc.record({ bpm: fc.float({ min: -1e6, max: 1e6, noNaN: true }), masterVolume: fc.float({ min: -1e6, max: 1e6, noNaN: true }), tracks: fc.record(t) });
}

describe('validateState — PBT', () => {
  it('step count invariant', () => {
    fc.assert(fc.property(arbState(), (raw) => ALL.every((n) => validateState(raw).tracks[n].steps.length === STEP_COUNT)), { numRuns: 500 });
  });
  it('BPM in [60, 200]', () => {
    fc.assert(fc.property(arbState(), (raw) => { const b = validateState(raw).bpm; return b >= 60 && b <= 200; }), { numRuns: 500 });
  });
  it('params within ranges', () => {
    fc.assert(fc.property(arbState(), (raw) => {
      const r = validateState(raw);
      for (const n of ALL) for (const [k, [min, max]] of Object.entries(PARAM_RANGES[n])) { const v = r.tracks[n].params[k]; if (v < min || v > max) return false; }
      return true;
    }), { numRuns: 500 });
  });
});
