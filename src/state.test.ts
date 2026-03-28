import { describe, it, expect } from 'vitest';
import { defaultState, INSTRUMENT_NAMES } from './state.js';

describe('defaultState()', () => {
  it('returns bpm of 130', () => {
    expect(defaultState().bpm).toBe(130);
  });

  it('returns swing of 0 per track', () => {
    const state = defaultState();
    for (const name of INSTRUMENT_NAMES) {
      expect(state.tracks[name].swing).toBe(0);
    }
  });

  it('returns masterVolume of 0.8', () => {
    expect(defaultState().masterVolume).toBe(0.8);
  });

  it('creates a track for every instrument', () => {
    const state = defaultState();
    for (const name of INSTRUMENT_NAMES) {
      expect(state.tracks[name]).toBeDefined();
    }
  });

  it('every track has exactly 16 steps', () => {
    const state = defaultState();
    for (const name of INSTRUMENT_NAMES) {
      expect(state.tracks[name].steps).toHaveLength(16);
    }
  });

  it('every step is initially false', () => {
    const state = defaultState();
    for (const name of INSTRUMENT_NAMES) {
      expect(state.tracks[name].steps.every((s) => s === false)).toBe(true);
    }
  });

  it('kick has correct default params', () => {
    const { params } = defaultState().tracks.kick;
    expect(params.tune).toBe(80);
    expect(params.snap).toBe(10);
    expect(params.decay).toBe(800);
    expect(params.level).toBe(0.9);
  });

  it('snare has correct default params', () => {
    const { params } = defaultState().tracks.snare;
    expect(params.tune).toBe(200);
    expect(params.tone).toBe(0.5);
    expect(params.decay).toBe(200);
    expect(params.level).toBe(0.8);
  });

  it('clap has correct default params', () => {
    const { params } = defaultState().tracks.clap;
    expect(params.tone).toBe(1200);
    expect(params.decay).toBe(120);
    expect(params.level).toBe(0.75);
  });

  it('closedHat has correct default params', () => {
    const { params } = defaultState().tracks.closedHat;
    expect(params.tune).toBe(8000);
    expect(params.decay).toBe(60);
    expect(params.level).toBe(0.7);
  });

  it('openHat has correct default params', () => {
    const { params } = defaultState().tracks.openHat;
    expect(params.tune).toBe(7000);
    expect(params.decay).toBe(600);
    expect(params.level).toBe(0.65);
  });

  it('tom has correct default params', () => {
    const { params } = defaultState().tracks.tom;
    expect(params.tune).toBe(120);
    expect(params.decay).toBe(400);
    expect(params.level).toBe(0.75);
  });

  it('blip has correct default params', () => {
    const { params } = defaultState().tracks.blip;
    expect(params.tune).toBe(800);
    expect(params.tone).toBe(0.3);
    expect(params.decay).toBe(80);
    expect(params.level).toBe(0.7);
  });

  it('returns independent state objects on each call', () => {
    const a = defaultState();
    const b = defaultState();
    a.tracks.kick.steps[0] = true;
    expect(b.tracks.kick.steps[0]).toBe(false);
  });
});
