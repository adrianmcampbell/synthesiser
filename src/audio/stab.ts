/**
 * Dubby stab synthesis voice.
 *
 * A short chord stab using detuned sawtooth oscillators through a bandpass
 * filter with a fast filter envelope. Classic dub techno stab texture.
 *
 * params: tune (60–800 Hz), cutoff (200–6000 Hz), resonance (0–20),
 *         decay (30–800 ms), level (0–1)
 */

import { getAudioContext } from './context.js';
import { getMasterGain } from './mixer.js';

export interface StabVoice {
  trigger(time: number, params: Record<string, number>): void;
}

export function createStab(
  audioContext: AudioContext = getAudioContext(),
  masterGain: GainNode = getMasterGain(),
): StabVoice {
  return {
    trigger(time: number, params: Record<string, number>): void {
      const tune      = params['tune']      ?? 220;
      const cutoff    = params['cutoff']    ?? 1200;
      const resonance = params['resonance'] ?? 8;
      const decay     = params['decay']     ?? 150;
      const level     = params['level']     ?? 0.7;

      const decaySec = decay / 1000;

      // Two detuned sawtooth oscillators for width
      const osc1 = audioContext.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(tune, time);

      const osc2 = audioContext.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(tune * 1.005, time); // slight detune

      const mix = audioContext.createGain();
      mix.gain.value = 0.5;

      // Bandpass filter with envelope
      const filter = audioContext.createBiquadFilter();
      filter.type = 'bandpass';
      filter.Q.setValueAtTime(resonance, time);
      filter.frequency.setValueAtTime(Math.min(cutoff * 3, audioContext.sampleRate / 2 - 1), time);
      filter.frequency.exponentialRampToValueAtTime(Math.max(cutoff, 20), time + decaySec * 0.5);

      // Amplitude envelope — fast attack, configurable decay
      const ampGain = audioContext.createGain();
      ampGain.gain.setValueAtTime(level, time);
      ampGain.gain.exponentialRampToValueAtTime(0.001, time + decaySec);

      osc1.connect(mix);
      osc2.connect(mix);
      mix.connect(filter);
      filter.connect(ampGain);
      ampGain.connect(masterGain);

      osc1.start(time);
      osc2.start(time);
      osc1.stop(time + decaySec + 0.1);
      osc2.stop(time + decaySec + 0.1);
    },
  };
}
