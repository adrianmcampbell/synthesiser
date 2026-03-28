import { AppState, InstrumentName } from './state.js';

/** Voice interface for each instrument. */
export interface Voices {
  kick: { trigger(time: number, params: Record<string, number>): void };
  snare: { trigger(time: number, params: Record<string, number>): void };
  clap: { trigger(time: number, params: Record<string, number>): void };
  closedHat: { triggerClosed(time: number, params: Record<string, number>): void };
  openHat: { triggerOpen(time: number, params: Record<string, number>): void };
  tom: { trigger(time: number, params: Record<string, number>): void };
  blip: { trigger(time: number, params: Record<string, number>): void };
  acid: { trigger(time: number, params: Record<string, number>): void };
}

const SCHEDULE_AHEAD_TIME = 0.1; // seconds
const LOOKAHEAD_INTERVAL = 25;   // milliseconds

/**
 * Compute the scheduled time for a step, applying swing to odd steps.
 *
 * Property 6: Swing step timing
 * Even steps → baseTime; odd steps → baseTime + stepDuration * swing
 */
export function computeStepTime(
  baseTime: number,
  stepIndex: number,
  stepDuration: number,
  swing: number,
): number {
  if (stepIndex % 2 === 0) {
    return baseTime;
  }
  return baseTime + stepDuration * swing;
}

/**
 * Factory that creates a lookahead sequencer.
 *
 * @param audioContext - The Web Audio API context used for timing.
 * @param getState     - Callback that returns the current AppState on each tick.
 * @param voices       - Object containing trigger functions for each instrument.
 */
export function createSequencer(
  audioContext: AudioContext,
  getState: () => AppState,
  voices: Voices,
) {
  let currentStep = 0;
  let nextStepTime = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;

  // Visual sync state
  let rafId: number | null = null;
  let stepStartTimes: number[] = [];
  let stepDurationSnapshot = 0;

  /** Trigger the appropriate voice for a given instrument at the scheduled time. */
  function triggerVoice(name: InstrumentName, time: number, params: Record<string, number>): void {
    switch (name) {
      case 'kick':    voices.kick.trigger(time, params); break;
      case 'snare':   voices.snare.trigger(time, params); break;
      case 'clap':    voices.clap.trigger(time, params); break;
      case 'closedHat': voices.closedHat.triggerClosed(time, params); break;
      case 'openHat': voices.openHat.triggerOpen(time, params); break;
      case 'tom':     voices.tom.trigger(time, params); break;
      case 'blip':    voices.blip.trigger(time, params); break;
      case 'acid':    voices.acid.trigger(time, params); break;
    }
  }

  /** Core scheduling loop — called every 25ms by setInterval. */
  function schedule(): void {
    const state = getState();
    const { bpm, tracks } = state;
    const stepDuration = 60 / bpm / 4; // 16th note duration in seconds
    stepDurationSnapshot = stepDuration;

    // Determine solo state: if any track is soloed, only soloed tracks play
    const soloedTracks = (Object.keys(tracks) as InstrumentName[]).filter(
      (n) => (tracks[n] as { muted: boolean; solo?: boolean }).solo,
    );
    const hasSolo = soloedTracks.length > 0;

    while (nextStepTime < audioContext.currentTime + SCHEDULE_AHEAD_TIME) {
      const baseTime = nextStepTime;

      // Use the first track's swing as the global base, but each track can
      // override with its own per-track swing value
      stepStartTimes[currentStep] = baseTime; // record base for visual sync

      // Trigger active steps for each track
      for (const name of Object.keys(tracks) as InstrumentName[]) {
        const track = tracks[name];
        const isMuted = track.muted || (hasSolo && !soloedTracks.includes(name));
        if (isMuted) continue;
        if (!track.steps[currentStep]) continue;

        const scheduledTime = computeStepTime(baseTime, currentStep, stepDuration, track.swing);
        triggerVoice(name, scheduledTime, track.params);
      }

      // Advance to next step
      currentStep = (currentStep + 1) % 16;
      nextStepTime = baseTime + stepDuration;
    }
  }

  /** Start the sequencer. */
  function start(): void {
    if (intervalId !== null) return; // already running
    currentStep = 0;
    nextStepTime = audioContext.currentTime;
    stepStartTimes = new Array(16).fill(audioContext.currentTime);
    intervalId = setInterval(schedule, LOOKAHEAD_INTERVAL);
  }

  /** Stop the sequencer and reset to step 0. */
  function stop(): void {
    if (intervalId !== null) {
      clearInterval(intervalId);
      intervalId = null;
    }
    currentStep = 0;
    nextStepTime = 0;
    stepStartTimes = [];
  }

  /** Return the current step index (for external polling). */
  function getCurrentStep(): number {
    return currentStep;
  }

  /**
   * Start a requestAnimationFrame loop that maps audioContext.currentTime
   * back to a visual step index and calls onStep on each frame.
   * Requirements: 1.9, 8.11
   */
  function startVisualSync(onStep: (step: number) => void): void {
    if (rafId !== null) return;

    function loop(): void {
      if (stepStartTimes.length === 16 && stepDurationSnapshot > 0) {
        const now = audioContext.currentTime;
        // Find the most recently scheduled step whose time has passed
        let visualStep = 0;
        let latestPast = -Infinity;
        for (let i = 0; i < 16; i++) {
          const t = stepStartTimes[i];
          if (t <= now && t > latestPast) {
            latestPast = t;
            visualStep = i;
          }
        }
        onStep(visualStep);
      }
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
  }

  /** Stop the requestAnimationFrame visual sync loop. */
  function stopVisualSync(): void {
    if (rafId !== null) {
      cancelAnimationFrame(rafId);
      rafId = null;
    }
  }

  return { start, stop, getCurrentStep, startVisualSync, stopVisualSync };
}
