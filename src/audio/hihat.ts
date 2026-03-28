/**
 * Hi-Hat synthesis voices (Closed Hat + Open Hat).
 *
 * Both voices share the same metallic oscillator mix: 6× square wave
 * oscillators at inharmonic frequency ratios (40Hz × [2, 3, 4.16, 5.43,
 * 6.79, 8.21]) routed through a highpass filter.
 *
 * Closed hat: short decay (10ms–200ms), fire-and-forget.
 * Open hat:   longer decay (100ms–2000ms), retrigger resets the envelope.
 *
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9
 */

import { getAudioContext } from './context.js';
import { getMasterGain } from './mixer.js';

/** Inharmonic frequency multipliers for the metallic oscillator mix. */
const FREQ_RATIOS = [2, 3, 4.16, 5.43, 6.79, 8.21] as const;
/** Base frequency (Hz) for the metallic mix. */
const BASE_FREQ = 40;

export interface HiHatVoice {
  triggerClosed(time: number, params: Record<string, number>): void;
  triggerOpen(time: number, params: Record<string, number>): void;
}

/**
 * Build the shared metallic oscillator mix graph and return the amplitude
 * GainNode (envelope target) and the array of oscillators so they can be
 * started and stopped.
 *
 * Graph per trigger:
 *   6× OscillatorNode (square) → individual GainNode (1/6)
 *     → mix GainNode
 *     → BiquadFilterNode (highpass, tune Hz)
 *     → ampGain (envelope)
 *     → masterGain
 */
function buildMetallicGraph(
  ctx: AudioContext,
  masterGain: GainNode,
  tune: number,
  time: number,
): { oscillators: OscillatorNode[]; ampGain: GainNode } {
  const mixGain = ctx.createGain();
  mixGain.gain.value = 1;

  const hpFilter = ctx.createBiquadFilter();
  hpFilter.type = 'highpass';
  hpFilter.frequency.setValueAtTime(tune, time);

  const ampGain = ctx.createGain();

  // Connect mix → filter → amp → master
  mixGain.connect(hpFilter);
  hpFilter.connect(ampGain);
  ampGain.connect(masterGain);

  const oscillators: OscillatorNode[] = [];

  for (const ratio of FREQ_RATIOS) {
    const osc = ctx.createOscillator();
    osc.type = 'square';
    osc.frequency.setValueAtTime(BASE_FREQ * ratio, time);

    const oscGain = ctx.createGain();
    oscGain.gain.value = 1 / FREQ_RATIOS.length; // 1/6 each

    osc.connect(oscGain);
    oscGain.connect(mixGain);

    oscillators.push(osc);
  }

  return { oscillators, ampGain };
}

/**
 * Factory that creates a hi-hat voice connected to the shared audio graph.
 *
 * @param audioContext - The AudioContext to use for node creation.
 * @param masterGain   - The destination GainNode for the voice output.
 */
export function createHiHat(
  audioContext: AudioContext = getAudioContext(),
  masterGain: GainNode = getMasterGain(),
): HiHatVoice {
  // Track the current open hat amplitude gain node for retrigger support.
  let openHatAmpGain: GainNode | null = null;
  let openHatOscillators: OscillatorNode[] | null = null;
  let openHatStopTime = 0;

  return {
    /**
     * Trigger a closed hi-hat — short decay, fire-and-forget.
     * Requirements: 5.1, 5.3, 5.6, 5.8
     */
    triggerClosed(time: number, params: Record<string, number>): void {
      const tune  = params['tune']  ?? 8000; // highpass cutoff Hz (4000–12000)
      const decay = params['decay'] ?? 60;   // amplitude decay ms (10–200)
      const level = params['level'] ?? 0.7;  // output level (0–1)

      const decaySec = decay / 1000;

      const { oscillators, ampGain } = buildMetallicGraph(
        audioContext,
        masterGain,
        tune,
        time,
      );

      // Amplitude envelope: level → near-zero over decay ms
      ampGain.gain.setValueAtTime(level, time);
      ampGain.gain.exponentialRampToValueAtTime(0.001, time + decaySec);

      const stopTime = time + decaySec + 0.05;
      for (const osc of oscillators) {
        osc.start(time);
        osc.stop(stopTime);
      }
    },

    /**
     * Trigger an open hi-hat — longer decay, retrigger resets envelope.
     * Requirements: 5.2, 5.4, 5.5, 5.7, 5.9
     */
    triggerOpen(time: number, params: Record<string, number>): void {
      const tune  = params['tune']  ?? 7000; // highpass cutoff Hz (4000–12000)
      const decay = params['decay'] ?? 600;  // amplitude decay ms (100–2000)
      const level = params['level'] ?? 0.65; // output level (0–1)

      const decaySec = decay / 1000;
      const stopTime = time + decaySec + 0.05;

      // Retrigger: if a previous open hat is still playing, cancel its
      // scheduled envelope values and ramp it down quickly so the new voice
      // takes over cleanly (Requirement 5.5).
      if (openHatAmpGain !== null && time < openHatStopTime) {
        openHatAmpGain.gain.cancelScheduledValues(time);
        openHatAmpGain.gain.setValueAtTime(
          openHatAmpGain.gain.value,
          time,
        );
        openHatAmpGain.gain.linearRampToValueAtTime(0, time + 0.005);
        // Stop old oscillators shortly after the quick fade
        if (openHatOscillators) {
          for (const osc of openHatOscillators) {
            try { osc.stop(time + 0.01); } catch { /* already stopped */ }
          }
        }
      }

      const { oscillators, ampGain } = buildMetallicGraph(
        audioContext,
        masterGain,
        tune,
        time,
      );

      // Amplitude envelope: level → near-zero over decay ms
      ampGain.gain.setValueAtTime(level, time);
      ampGain.gain.exponentialRampToValueAtTime(0.001, time + decaySec);

      for (const osc of oscillators) {
        osc.start(time);
        osc.stop(stopTime);
      }

      // Store references for potential retrigger
      openHatAmpGain = ampGain;
      openHatOscillators = oscillators;
      openHatStopTime = stopTime;
    },
  };
}
