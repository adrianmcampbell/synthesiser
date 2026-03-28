/**
 * Kick drum synthesis voice.
 *
 * Sine oscillator with a pitch envelope (tune → 40 Hz over snap ms) and an
 * amplitude envelope (1 → 0 over decay ms). Each trigger creates a fresh
 * node graph that is fire-and-forget — nodes self-clean via oscillator.onended.
 *
 * Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7
 */

import { getAudioContext } from './context.js';
import { getMasterGain } from './mixer.js';

export interface KickVoice {
  trigger(time: number, params: Record<string, number>): void;
}

/**
 * Factory that creates a kick voice connected to the shared audio graph.
 *
 * @param audioContext - The AudioContext to use for node creation.
 * @param masterGain   - The destination GainNode for the voice output.
 */
export function createKick(
  audioContext: AudioContext = getAudioContext(),
  masterGain: GainNode = getMasterGain(),
): KickVoice {
  return {
    trigger(time: number, params: Record<string, number>): void {
      const tune = params['tune'] ?? 80;    // start frequency in Hz (40–200)
      const snap = params['snap'] ?? 10;    // pitch sweep duration in ms (1–80)
      const decay = params['decay'] ?? 800; // amplitude envelope duration in ms (100–3000)
      const level = params['level'] ?? 0.9; // output level (0–1)

      const snapSec = snap / 1000;
      const decaySec = decay / 1000;

      // --- Oscillator (sine) ---
      const osc = audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(tune, time);
      // Pitch envelope: sweep down to 40 Hz over snap ms
      osc.frequency.exponentialRampToValueAtTime(40, time + snapSec);

      // --- Amplitude envelope ---
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(level, time);
      // Ramp to near-zero (exponentialRamp requires a positive target)
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + decaySec);

      // --- Connect graph ---
      osc.connect(gainNode);
      gainNode.connect(masterGain);

      // --- Schedule playback ---
      osc.start(time);
      // Stop slightly after the envelope ends to allow full tail
      osc.stop(time + decaySec + 0.1);
    },
  };
}
