import { AppState, InstrumentName, STEP_COUNT } from './state.js';

export interface Voices {
  kick: { trigger(time: number, params: Record<string, number>): void };
  snare: { trigger(time: number, params: Record<string, number>): void };
  clap: { trigger(time: number, params: Record<string, number>): void };
  closedHat: { triggerClosed(time: number, params: Record<string, number>): void };
  openHat: { triggerOpen(time: number, params: Record<string, number>): void };
  tom: { trigger(time: number, params: Record<string, number>): void };
  blip: { trigger(time: number, params: Record<string, number>): void };
  blip2: { trigger(time: number, params: Record<string, number>): void };
  blip3: { trigger(time: number, params: Record<string, number>): void };
  stab: { trigger(time: number, params: Record<string, number>): void };
}

const SCHEDULE_AHEAD_TIME = 0.1;
const LOOKAHEAD_INTERVAL = 25;

export function computeStepTime(baseTime: number, stepIndex: number, stepDuration: number, swing: number): number {
  return stepIndex % 2 === 0 ? baseTime : baseTime + stepDuration * swing;
}

export function createSequencer(audioContext: AudioContext, getState: () => AppState, voices: Voices) {
  let currentStep = 0;
  let nextStepTime = 0;
  let intervalId: ReturnType<typeof setInterval> | null = null;
  let rafId: number | null = null;
  let stepStartTimes: number[] = [];
  let stepDurationSnapshot = 0;

  function triggerVoice(name: InstrumentName, time: number, params: Record<string, number>): void {
    switch (name) {
      case 'kick':      voices.kick.trigger(time, params); break;
      case 'snare':     voices.snare.trigger(time, params); break;
      case 'clap':      voices.clap.trigger(time, params); break;
      case 'closedHat': voices.closedHat.triggerClosed(time, params); break;
      case 'openHat':   voices.openHat.triggerOpen(time, params); break;
      case 'tom':       voices.tom.trigger(time, params); break;
      case 'blip':      voices.blip.trigger(time, params); break;
      case 'blip2':     voices.blip2.trigger(time, params); break;
      case 'blip3':     voices.blip3.trigger(time, params); break;
      case 'stab':      voices.stab.trigger(time, params); break;
    }
  }

  function schedule(): void {
    const state = getState();
    const { bpm, tracks } = state;
    const stepDuration = 60 / bpm / 4;
    stepDurationSnapshot = stepDuration;

    const soloedTracks = (Object.keys(tracks) as InstrumentName[]).filter((n) => tracks[n].solo);
    const hasSolo = soloedTracks.length > 0;

    while (nextStepTime < audioContext.currentTime + SCHEDULE_AHEAD_TIME) {
      const baseTime = nextStepTime;
      stepStartTimes[currentStep] = baseTime;

      for (const name of Object.keys(tracks) as InstrumentName[]) {
        const track = tracks[name];
        if (track.muted || (hasSolo && !soloedTracks.includes(name))) continue;
        if (!track.steps[currentStep]) continue;
        const scheduledTime = computeStepTime(baseTime, currentStep, stepDuration, track.swing);
        triggerVoice(name, scheduledTime, track.params);
      }

      currentStep = (currentStep + 1) % STEP_COUNT;
      nextStepTime = baseTime + stepDuration;
    }
  }

  function start(): void {
    if (intervalId !== null) return;
    currentStep = 0;
    nextStepTime = audioContext.currentTime;
    stepStartTimes = new Array(STEP_COUNT).fill(audioContext.currentTime);
    intervalId = setInterval(schedule, LOOKAHEAD_INTERVAL);
  }

  function stop(): void {
    if (intervalId !== null) { clearInterval(intervalId); intervalId = null; }
    currentStep = 0;
    nextStepTime = 0;
    stepStartTimes = [];
  }

  function getCurrentStep(): number { return currentStep; }

  function startVisualSync(onStep: (step: number) => void): void {
    if (rafId !== null) return;
    function loop(): void {
      if (stepStartTimes.length === STEP_COUNT && stepDurationSnapshot > 0) {
        const now = audioContext.currentTime;
        let visualStep = 0, latestPast = -Infinity;
        for (let i = 0; i < STEP_COUNT; i++) {
          const t = stepStartTimes[i];
          if (t <= now && t > latestPast) { latestPast = t; visualStep = i; }
        }
        onStep(visualStep);
      }
      rafId = requestAnimationFrame(loop);
    }
    rafId = requestAnimationFrame(loop);
  }

  function stopVisualSync(): void {
    if (rafId !== null) { cancelAnimationFrame(rafId); rafId = null; }
  }

  return { start, stop, getCurrentStep, startVisualSync, stopVisualSync };
}
