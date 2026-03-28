/**
 * Blip synthesis voice.
 *
 * Sine oscillator through a WaveShaperNode (distortion amount driven by the
 * tone param) with a fast amplitude envelope. Each trigger creates a fresh
 * node graph that is fire-and-forget — nodes self-clean via oscillator.onended.
 *
 * Requirements: 7.1, 7.2, 7.3, 7.4, 7.5
 */

import { getAudioContext } from './context.js';
import { getMasterGain } from './mixer.js';

export interface BlipVoice {
  trigger(time: number, params: Record<string, number>): void;
}

/**
 * Builds a WaveShaper distortion curve for the given tone amount.
 *
 * @param tone - Distortion amount in [0, 1]. 0 = linear (clean), 1 = heavy distortion.
 * @param samples - Number of samples in the curve (default 256).
 */
function makeDistortionCurve(tone: number, samples = 256): Float32Array {
  const k = tone * 100;
  const curve = new Float32Array(samples);
  for (let i = 0; i < samples; i++) {
    // Map sample index to x in [-1, 1]
    const x = (i * 2) / (samples - 1) - 1;
    if (k === 0) {
      curve[i] = x; // linear — no distortion
    } else {
      curve[i] = ((3 + k) * x) / (Math.PI + k * Math.abs(x));
    }
  }
  return curve;
}

/**
 * Factory that creates a blip voice connected to the shared audio graph.
 *
 * @param audioContext - The AudioContext to use for node creation.
 * @param masterGain   - The destination GainNode for the voice output.
 */
export function createBlip(
  audioContext: AudioContext = getAudioContext(),
  masterGain: GainNode = getMasterGain(),
): BlipVoice {
  return {
    trigger(time: number, params: Record<string, number>): void {
      const tune = params['tune'] ?? 1000;  // frequency in Hz (200–4000)
      const tone = params['tone'] ?? 0;     // distortion amount (0–1)
      const decay = params['decay'] ?? 80;  // amplitude envelope duration in ms (5–300)
      const level = params['level'] ?? 0.8; // output level (0–1)

      const decaySec = decay / 1000;

      // --- Oscillator (sine) ---
      const osc = audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(tune, time);

      // --- WaveShaper (distortion) ---
      const waveshaper = audioContext.createWaveShaper();
      waveshaper.curve = makeDistortionCurve(Math.max(0, Math.min(1, tone)));
      waveshaper.oversample = '2x';

      // --- Amplitude envelope ---
      const gainNode = audioContext.createGain();
      gainNode.gain.setValueAtTime(level, time);
      gainNode.gain.exponentialRampToValueAtTime(0.001, time + decaySec);

      // --- Connect graph ---
      osc.connect(waveshaper);
      waveshaper.connect(gainNode);
      gainNode.connect(masterGain);

      // --- Schedule playback ---
      osc.start(time);
      osc.stop(time + decaySec + 0.05);
    },
  };
}
