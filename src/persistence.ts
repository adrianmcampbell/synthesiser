import type { AppState } from './state';
import { validateState } from './validateState';

const STORAGE_KEY = 'hypno-drum-state';

export function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export function loadState(): AppState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    return validateState(parsed);
  } catch {
    return null;
  }
}
