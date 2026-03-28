/**
 * Clap synthesis voice.
 *
 * Produces three staggered noise bursts (at 0ms, 10ms, 20ms offsets) each
 * routed through a bandpass filter centred at `tone` Hz.  Every burst has a
 * fast attack (1ms) followed by an exponential decay envelope.
 * Each trigger creates a fresh node graph (fire-and-forget).
 *
 * Requirements: 4.1, 4.2, 4.3, 4.4, 4.5
 */

import { getAudioContext } from './context.js';
import { getMasterGain } from './mixer.js';

export interface ClapVoice {
  trigger(time: number, params: Record<string, number>): void;
}

/**
 * Factory that creates a clap voice connected to the shared audio graph.
 *
 * @param audioContext - The AudioContext to use for node creation.
 * @param masterGain   - The destination GainNode for the voice output.
 */
export function createClap(
  audioContext: AudioContext = getAudioContext(),
  masterGain: GainNode = getMasterGain(),
): ClapVoice {
  return {
    trigger(time: number, params: Record<string, number>): void {
      const tone  = params['tone']  ?? 1200; // bandpass centre frequency in Hz (800–4000)
      const decay = params['decay'] ?? 100;  // envelope decay in ms (20–500)
      const level = params['level'] ?? 0.8;  // output level (0–1)

      const decaySec = decay / 1000;

      // Noise buffer shared across all three bursts (0.1s is enough)
      const bufferSize = Math.ceil(audioContext.sampleRate * 0.1);
      const noiseBuffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
      const channelData = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        channelData[i] = Math.random() * 2 - 1;
      }

      // Three bursts at 0ms, 10ms, 20ms offsets
      const offsets = [0, 0.01, 0.02];

      for (const offset of offsets) {
        const burstStart = time + offset;

        const noiseSource = audioContext.createBufferSource();
        noiseSource.buffer = noiseBuffer;

        const bpFilter = audioContext.createBiquadFilter();
        bpFilter.type = 'bandpass';
        bpFilter.frequency.setValueAtTime(tone, burstStart);
        bpFilter.Q.setValueAtTime(2, burstStart);

        const envGain = audioContext.createGain();
        // Fast attack: ramp from near-zero to level over 1ms
        envGain.gain.setValueAtTime(0.001, burstStart);
        envGain.gain.linearRampToValueAtTime(level, burstStart + 0.001);
        // Exponential decay to near-silence over decay ms
        envGain.gain.exponentialRampToValueAtTime(0.001, burstStart + decaySec);

        noiseSource.connect(bpFilter);
        bpFilter.connect(envGain);
        envGain.connect(masterGain);

        noiseSource.start(burstStart);
        noiseSource.stop(burstStart + decaySec + 0.05);
      }
    },
  };
}
