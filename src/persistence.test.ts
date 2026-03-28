import { describe, it, expect, beforeEach, vi } from 'vitest';
import { saveState, loadState } from './persistence';
import { defaultState } from './state';

// Mock localStorage
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

const STORAGE_KEY = 'hypno-drum-state';

describe('persistence', () => {
  beforeEach(() => {
    localStorageMock.clear();
    vi.clearAllMocks();
  });

  describe('saveState', () => {
    it('serialises state to JSON and writes to the correct key', () => {
      const state = defaultState();
      saveState(state);
      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        STORAGE_KEY,
        JSON.stringify(state),
      );
    });
  });

  describe('loadState', () => {
    it('returns null when no saved state exists', () => {
      expect(loadState()).toBeNull();
    });

    it('returns parsed state when valid JSON is stored', () => {
      const state = defaultState();
      localStorageMock.setItem(STORAGE_KEY, JSON.stringify(state));
      const loaded = loadState();
      expect(loaded).toEqual(state);
    });

    it('returns null when stored value is invalid JSON', () => {
      localStorageMock.setItem(STORAGE_KEY, 'not-valid-json{{{');
      expect(loadState()).toBeNull();
    });

    it('round-trips a modified state correctly', () => {
      const state = defaultState();
      state.bpm = 145;
      state.tracks.kick.swing = 0.2;
      state.tracks.kick.steps[0] = true;
      state.tracks.kick.params.decay = 1200;

      saveState(state);
      const loaded = loadState();
      expect(loaded).toEqual(state);
    });
  });
});
