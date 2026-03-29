import { describe, it, expect } from 'vitest';
import { defaultState, INSTRUMENT_NAMES, STEP_COUNT } from './state.js';

describe('defaultState()', () => {
  it('returns bpm of 130', () => { expect(defaultState().bpm).toBe(130); });
  it('returns masterVolume of 0.8', () => { expect(defaultState().masterVolume).toBe(0.8); });

  it('returns swing of 0 per track', () => {
    const state = defaultState();
    for (const name of INSTRUMENT_NAMES) expect(state.tracks[name].swing).toBe(0);
  });

  it('creates a track for every instrument', () => {
    const state = defaultState();
    for (const name of INSTRUMENT_NAMES) expect(state.tracks[name]).toBeDefined();
  });

  it(`every track has exactly ${STEP_COUNT} steps`, () => {
    const state = defaultState();
    for (const name of INSTRUMENT_NAMES) expect(state.tracks[name].steps).toHaveLength(STEP_COUNT);
  });

  it('every step is initially false', () => {
    const state = defaultState();
    for (const name of INSTRUMENT_NAMES) expect(state.tracks[name].steps.every((s) => !s)).toBe(true);
  });

  it('kick has correct default params', () => {
    const { params } = defaultState().tracks.kick;
    expect(params.tune).toBe(80); expect(params.snap).toBe(10);
    expect(params.decay).toBe(800); expect(params.level).toBe(0.9);
  });

  it('stab has correct default params', () => {
    const { params } = defaultState().tracks.stab;
    expect(params.tune).toBe(220); expect(params.cutoff).toBe(1200);
    expect(params.resonance).toBe(8); expect(params.decay).toBe(150);
  });

  it('blip2 has correct default params', () => {
    const { params } = defaultState().tracks.blip2;
    expect(params.tune).toBe(1600); expect(params.tone).toBe(0.6);
    expect(params.decay).toBe(40);
  });

  it('returns independent state objects on each call', () => {
    const a = defaultState(), b = defaultState();
    a.tracks.kick.steps[0] = true;
    expect(b.tracks.kick.steps[0]).toBe(false);
  });
});
