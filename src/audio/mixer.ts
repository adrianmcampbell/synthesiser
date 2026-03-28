/**
 * Master gain node (mixer).
 *
 * Lazy-initialised alongside the AudioContext so that no Web Audio nodes are
 * created before the first user interaction (Requirement 9.3).
 *
 * All synthesis voices connect their output to the node returned by
 * `getMasterGain()` (Requirement 9.1).
 */

import { getAudioContext } from './context.js';

let _masterGain: GainNode | null = null;

/** Return the shared master GainNode, creating and connecting it on first call. */
export function getMasterGain(): GainNode {
  if (!_masterGain) {
    const ctx = getAudioContext();
    _masterGain = ctx.createGain();
    _masterGain.gain.value = 0.8; // default masterVolume
    _masterGain.connect(ctx.destination);
  }
  return _masterGain;
}

/**
 * Set the master output volume.
 * @param volume — value in [0, 1] (Requirement 9.2)
 */
export function setMasterVolume(volume: number): void {
  getMasterGain().gain.value = Math.max(0, Math.min(1, volume));
}
