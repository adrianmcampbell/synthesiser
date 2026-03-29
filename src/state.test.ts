import { describe, it, expect } from 'vitest';
import { defaultState, INSTRUMENT_NAMES, STEP_COUNT } from './state.js';

describe('defaultState()', () => {
  it('returns bpm of 130', () => { expect(defaultState().bpm).toBe(130); });
  it('returns masterVolume of 0.8', () => { expect(defaultState().masterVolume).toBe(0.8); });

  it('returns swing of 0 per track', () => {
    for (const name of INSTRUMENT_NAMES) expect(defaultState().tracks[name].swing).toBe(0);
  });

  it('creates a track for every instrument', () => {
    for (const name of INSTRUMENT_NAMES) expect(defaultState().tracks[name]).toBeDefined();
  });

  it(`every track has ${STEP_COUNT} steps`, () => {
    for (const name of INSTRUMENT_NAMES) expect(defaultState().tracks[name].steps).toHaveLength(STEP_COUNT);
  });

  it('every step is initially false', () => {
    for (const name of INSTRUMENT_NAMES) expect(defaultState().tracks[name].steps.every((s) => !s)).toBe(true);
  });

  it('stab has correct defaults', () => {
    const { params } = defaultState().tracks.stab;
    expect(params.tune).toBe(110); expect(params.cutoff).toBe(600);
  });

  it('blip3 has correct defaults', () => {
    const { params } = defaultState().tracks.blip3;
    expect(params.tune).toBe(440); expect(params.feedback).toBe(0.5);
  });

  it('returns independent state objects', () => {
    const a = defaultState(), b = defaultState();
    a.tracks.kick.steps[0] = true;
    expect(b.tracks.kick.steps[0]).toBe(false);
  });
});
