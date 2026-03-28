/**
 * Snare drum synthesis voice.
 *
 * Mixes a sine oscillator body with highpass-filtered white noise.
 * Independent amplitude envelopes for each component; the `tone` parameter
 * controls the body/noise ratio (0 = full noise, 1 = full tone).
 * Each trigger creates a fresh node graph (fire-and-forget).
 *
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6
 */

import { getAudioContext } from './context.js';
import { getMasterGain } from './mixer.js';

export interface SnareVoice {
  trigger(time: number, params: Record<string, number>): void;
}

/**
 * Factory that creates a snare voice connected to the shared audio graph.
 *
 * @param audioContext - The AudioContext to use for node creation.
 * @param masterGain   - The destination GainNode for the voice output.
 */
export function createSnare(
  audioContext: AudioContext = getAudioContext(),
  masterGain: GainNode = getMasterGain(),
): SnareVoice {
  return {
    trigger(time: number, params: Record<string, number>): void {
      const tune  = params['tune']  ?? 200;  // body oscillator frequency in Hz (100–400)
      const tone  = params['tone']  ?? 0.5;  // body/noise ratio: 0=full noise, 1=full tone (0–1)
      const decay = params['decay'] ?? 200;  // envelope duration in ms (50–800)
      const level = params['level'] ?? 0.8;  // output level (0–1)

      const decaySec = decay / 1000;

      // Shared mix bus for both components
      const mixGain = audioContext.createGain();
      mixGain.gain.setValueAtTime(1, time);
      mixGain.connect(masterGain);

      // --- Body: sine oscillator ---
      const osc = audioContext.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(tune, time);

      const bodyGain = audioContext.createGain();
      bodyGain.gain.setValueAtTime(level * tone, time);
      bodyGain.gain.exponentialRampToValueAtTime(0.001, time + decaySec);

      osc.connect(bodyGain);
      bodyGain.connect(mixGain);

      osc.start(time);
      osc.stop(time + decaySec + 0.1);

      // --- Noise: white noise through highpass filter ---
      // Create a 0.5-second mono noise buffer
      const bufferSize = Math.ceil(audioContext.sampleRate * 0.5);
      const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const channelData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        channelData[i] = Math.random() * 2 - 1;
      }

      const noiseSource = audioContext.createBufferSource();
      noiseSource.buffer = noiseBuffer;

      const hpFilter = audioContext.createBiquadFilter();
      hpFilter.type = 'highpass';
      hpFilter.frequency.setValueAtTime(1000, time);

      const noiseGain = audioContext.createGain();
      noiseGain.gain.setValueAtTime(level * (1 - tone), time);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, time + decaySec);

      noiseSource.connect(hpFilter);
      hpFilter.connect(noiseGain);
      noiseGain.connect(mixGain);

      noiseSource.start(time);
      noiseSource.stop(time + decaySec + 0.1);
    },
  };
}
