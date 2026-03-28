/**
 * Acid bass synthesis voice.
 *
 * Classic 303-style: sawtooth oscillator through a resonant lowpass filter
 * with a filter envelope. The cutoff sweeps from a high value down to the
 * base cutoff over the envelope decay, creating the characteristic "wah" sweep.
 * Perfect for hypnotic techno basslines.
 *
 * params: tune (40–400 Hz, base pitch), cutoff (200–8000 Hz, filter base cutoff),
 *         resonance (0–30, filter Q), envAmt (0–1, filter envelope amount),
 *         decay (50–2000 ms), level (0–1)
 */

import { getAudioContext } from './context.js';
import { getMasterGain } from './mixer.js';

export interface AcidVoice {
  trigger(time: number, params: Record<string, number>): void;
}

export function createAcid(
  audioContext: AudioContext = getAudioContext(),
  masterGain: GainNode = getMasterGain(),
): AcidVoice {
  return {
    trigger(time: number, params: Record<string, number>): void {
      const tune      = params['tune']      ?? 110;  // base pitch Hz (40–400)
      const cutoff    = params['cutoff']    ?? 800;  // filter base cutoff Hz (200–8000)
      const resonance = params['resonance'] ?? 15;   // filter Q (0–30)
      const envAmt    = params['envAmt']    ?? 0.7;  // filter envelope amount (0–1)
      const decay     = params['decay']     ?? 300;  // decay ms (50–2000)
      const level     = params['level']     ?? 0.8;  // output level (0–1)

      const decaySec = decay / 1000;

      // Sawtooth oscillator
      const osc = audioContext.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(tune, time);

      // Resonant lowpass filter with envelope
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(resonance, time);

      // Filter envelope: sweep from cutoff * (1 + envAmt * 4) down to cutoff
      const peakCutoff = cutoff + (cutoff * envAmt * 4);
      filter.frequency.setValueAtTime(Math.min(peakCutoff, audioContext.sampleRate / 2 - 1), time);
      filter.frequency.exponentialRampToValueAtTime(Math.max(cutoff, 20), time + decaySec);

      // Amplitude envelope
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(level, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + decaySec);

      osc.connect(filter);
      filter.connect(gainNode);
      gainNode.connect(masterGain);

      osc.start(time);
      osc.stop(time + decaySec + 0.1);
    },
  };
}
