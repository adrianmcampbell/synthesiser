/**
 * Blip3 — FM metallic percussion voice.
 *
 * Uses frequency modulation: a modulator oscillator modulates a carrier,
 * producing bell-like / metallic tones. Feedback param controls mod depth.
 * Completely different timbre from the waveshaper-based blip/blip2.
 *
 * params: tune (100–3000 Hz), decay (10–500 ms), feedback (0–1), level (0–1)
 */

import { getAudioContext } from './context.js';
import { getMasterGain } from './mixer.js';

export interface Blip3Voice {
  trigger(time: number, params: Record<string, number>): void;
}

export function createBlip3(
  audioContext: AudioContext = getAudioContext(),
  masterGain: GainNode = getMasterGain(),
): Blip3Voice {
  return {
    trigger(time: number, params: Record<string, number>): void {
      const tune     = params['tune']     ?? 440;
      const decay    = params['decay']    ?? 60;
      const feedback = params['feedback'] ?? 0.5;
      const level    = params['level']    ?? 0.6;

      const decaySec = decay / 1000;

      // Modulator oscillator
      const mod = audioContext.createOscillator();
      mod.type = 'sine';
      mod.frequency.setValueAtTime(tune * 1.41, time); // inharmonic ratio for metallic tone

      const modGain = audioContext.createGain();
      modGain.gain.setValueAtTime(tune * feedback * 4, time);
      modGain.gain.exponentialRampToValueAtTime(1, time + decaySec);

      // Carrier oscillator
      const carrier = audioContext.createOscillator();
      carrier.type = 'sine';
      carrier.frequency.setValueAtTime(tune, time);

      // FM connection: mod → modGain → carrier.frequency
      mod.connect(modGain);
      modGain.connect(carrier.frequency);

      // Amplitude envelope
      const ampGain = audioContext.createGain();
      ampGain.gain.setValueAtTime(level, time);
      ampGain.gain.exponentialRampToValueAtTime(0.001, time + decaySec);

      carrier.connect(ampGain);
      ampGain.connect(masterGain);

      mod.start(time);
      carrier.start(time);
      mod.stop(time + decaySec + 0.05);
      carrier.stop(time + decaySec + 0.05);
    },
  };
}
