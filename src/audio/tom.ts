/**
 * Tom drum synthesis voice.
 *
 * Sine oscillator with a pitch envelope (tune → tune×0.3 over decay×0.3 ms)
 * and an amplitude envelope (level → 0 over decay ms). Each trigger creates a
 * fresh node graph that is fire-and-forget — nodes self-clean via oscillator.onended.
 *
 * Requirements: 6.1, 6.2, 6.3, 6.4, 6.5
 */

import { getAudioContext } from './context.js';
import { getMasterGain } from './mixer.js';

export interface TomVoice {
  trigger(time: number, params: Record<string, number>): void;
}

/**
 * Factory that creates a tom voice connected to the shared audio graph.
 *
 * @param audioContext - The AudioContext to use for node creation.
 * @param masterGain   - The destination GainNode for the voice output.
 */
export function createTom(
  audioContext: AudioContext = getAudioContext(),
  masterGain: GainNode = getMasterGain(),
): TomVoice {
  return {
    trigger(time: number, params: Record<string, number>): void {
      const tune = params['tune'] ?? 200;   // base pitch in Hz (60–500)
      const decay = params['decay'] ?? 400; // amplitude envelope duration in ms (50–1500)
      const level = params['level'] ?? 0.8; // output level (0–1)

      const pitchEndTime = time + (decay * 0.3) / 1000;
      const decaySec = decay / 1000;

      // --- Oscillator (sine) ---
      const osc = audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(tune, time);
      // Pitch envelope: sweep down to tune×0.3 over decay×0.3 ms
      osc.frequency.exponentialRampToValueAtTime(tune * 0.3, pitchEndTime);

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
