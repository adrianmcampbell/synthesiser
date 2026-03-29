import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveState, loadState } from './persistence';
import { defaultState } from './state';

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

describe('persistence', () => {
  beforeEach(() => { localStorageMock.clear(); vi.clearAllMocks(); });

  it('serialises state to JSON', () => {
    const state = defaultState();
    saveState(state);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('hypno-drum-state', JSON.stringify(state));
  });

  it('returns null when no saved state', () => { expect(loadState()).toBeNull(); });

  it('round-trips a modified state', () => {
    const state = defaultState();
    state.bpm = 145;
    state.tracks.kick.steps[0] = true;
    state.tracks.kick.params.decay = 1200;
    saveState(state);
    expect(loadState()).toEqual(state);
  });
});
