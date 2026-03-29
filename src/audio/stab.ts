/**
 * Dubby stab synthesis voice — thick and deep.
 *
 * Three detuned sawtooth oscillators + a sub sine oscillator one octave below,
 * all through a resonant lowpass filter with envelope sweep. Produces a fat,
 * warm, deep dub techno chord stab.
 *
 * params: tune (40–400 Hz), cutoff (100–4000 Hz), resonance (0–25),
 *         decay (50–1500 ms), level (0–1)
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
      const tune      = params['tune']      ?? 110;
      const cutoff    = params['cutoff']    ?? 600;
      const resonance = params['resonance'] ?? 12;
      const decay     = params['decay']     ?? 300;
      const level     = params['level']     ?? 0.8;

      const decaySec = decay / 1000;

      // Three detuned sawtooth oscillators for thickness
      const osc1 = audioContext.createOscillator();
      osc1.type = 'sawtooth';
      osc1.frequency.setValueAtTime(tune, time);

      const osc2 = audioContext.createOscillator();
      osc2.type = 'sawtooth';
      osc2.frequency.setValueAtTime(tune * 1.007, time);

      const osc3 = audioContext.createOscillator();
      osc3.type = 'sawtooth';
      osc3.frequency.setValueAtTime(tune * 0.993, time);

      // Sub oscillator — one octave below for depth
      const sub = audioContext.createOscillator();
      sub.type = 'sine';
      sub.frequency.setValueAtTime(tune * 0.5, time);

      // Mix all oscillators
      const mix = audioContext.createGain();
      mix.gain.value = 0.3;

      const subGain = audioContext.createGain();
      subGain.gain.value = 0.5;

      // Lowpass filter with envelope — sweeps down for that deep dub feel
      const filter = audioContext.createBiquadFilter();
      filter.type = 'lowpass';
      filter.Q.setValueAtTime(resonance, time);
      const peakCutoff = Math.min(cutoff * 5, audioContext.sampleRate / 2 - 1);
      filter.frequency.setValueAtTime(peakCutoff, time);
      filter.frequency.exponentialRampToValueAtTime(Math.max(cutoff, 20), time + decaySec * 0.4);

      // Amplitude envelope
      const ampGain = audioContext.createGain();
      ampGain.gain.setValueAtTime(level, time);
      ampGain.gain.exponentialRampToValueAtTime(0.001, time + decaySec);

      // Connect graph
      osc1.connect(mix);
      osc2.connect(mix);
      osc3.connect(mix);
      sub.connect(subGain);
      subGain.connect(mix);
      mix.connect(filter);
      filter.connect(ampGain);
      ampGain.connect(masterGain);

      const oscs = [osc1, osc2, osc3, sub];
      for (const o of oscs) { o.start(time); o.stop(time + decaySec + 0.1); }
    },
  };
}
