/**
 * Entry point — wires all modules together.
 */

import './style.css';

import { AppState, FxState, INSTRUMENT_NAMES, InstrumentName, MasterFxState, defaultState } from './state.js';
import { saveState, loadState } from './persistence.js';
import { validateState } from './validateState.js';
import { getAudioContext, resumeAudioContext } from './audio/context.js';
import { getMasterGain, setMasterVolume } from './audio/mixer.js';
import { createKick } from './audio/kick.js';
import { createSnare } from './audio/snare.js';
import { createClap } from './audio/clap.js';
import { createHiHat } from './audio/hihat.js';
import { createTom } from './audio/tom.js';
import { createBlip } from './audio/blip.js';
import { createAcid } from './audio/acid.js';
import { createSequencer, Voices } from './sequencer.js';
import { createTransport } from './ui/transport.js';
import { createTrackRow, getStepButtons } from './ui/track.js';
import { setPlaying } from './ui/stepButton.js';

// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let appState: AppState = validateState(loadState()) ?? defaultState();

let saveTimer: ReturnType<typeof setTimeout> | null = null;
function debouncedSave(): void {
  if (saveTimer !== null) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => saveState(appState), 50);
}

// ---------------------------------------------------------------------------
// Audio
// ---------------------------------------------------------------------------
const audioContext = getAudioContext();
const masterGain = getMasterGain();

const kick      = createKick(audioContext, masterGain);
const snare     = createSnare(audioContext, masterGain);
const clap      = createClap(audioContext, masterGain);
const hihat     = createHiHat(audioContext, masterGain);
const tom       = createTom(audioContext, masterGain);
const blip      = createBlip(audioContext, masterGain);
const acid      = createAcid(audioContext, masterGain);

setMasterVolume(appState.masterVolume);

const voices: Voices = {
  kick, snare, clap,
  closedHat: hihat,
  openHat: hihat,
  tom, blip, acid,
};

const sequencer = createSequencer(audioContext, () => appState, voices);

// ---------------------------------------------------------------------------
// DOM structure
// ---------------------------------------------------------------------------
const app = document.getElementById('app') ?? document.body;

// Header
const headerEl = document.createElement('div');
headerEl.className = 'app-header';
const titleEl = document.createElement('span');
titleEl.className = 'app-title';
titleEl.textContent = 'HYPNO';
headerEl.appendChild(titleEl);
app.appendChild(headerEl);

// Transport
const transport = createTransport({
  bpm: appState.bpm,
  masterVolume: appState.masterVolume,
  masterFx: appState.masterFx,

  onPlay: async () => {
    await resumeAudioContext();
    sequencer.start();
    sequencer.startVisualSync(updateVisualStep);
  },

  onStop: () => {
    sequencer.stop();
    sequencer.stopVisualSync();
    for (const row of trackRows.values()) {
      for (const btn of getStepButtons(row)) setPlaying(btn, false);
    }
  },

  onBpmChange: (bpm) => {
    appState = { ...appState, bpm };
    debouncedSave();
  },

  onMasterVolumeChange: (vol) => {
    appState = { ...appState, masterVolume: vol };
    setMasterVolume(vol);
    debouncedSave();
  },

  onMasterFxChange: (param: keyof MasterFxState, value: number) => {
    appState = { ...appState, masterFx: { ...appState.masterFx, [param]: value } };
    debouncedSave();
  },
});
app.appendChild(transport);

// Track rows
const trackRows = new Map<InstrumentName, HTMLElement>();

for (const name of INSTRUMENT_NAMES) {
  const row = createTrackRow(name, appState.tracks[name], {
    onStepToggle: (step, active) => {
      const steps = [...appState.tracks[name].steps];
      steps[step] = active;
      appState = {
        ...appState,
        tracks: { ...appState.tracks, [name]: { ...appState.tracks[name], steps } },
      };
      debouncedSave();
    },

    onParamChange: (param, value) => {
      appState = {
        ...appState,
        tracks: {
          ...appState.tracks,
          [name]: {
            ...appState.tracks[name],
            params: { ...appState.tracks[name].params, [param]: value },
          },
        },
      };
      debouncedSave();
    },

    onFxChange: (param: keyof FxState, value: number) => {
      appState = {
        ...appState,
        tracks: {
          ...appState.tracks,
          [name]: {
            ...appState.tracks[name],
            fx: { ...appState.tracks[name].fx, [param]: value },
          },
        },
      };
      debouncedSave();
    },

    onMuteToggle: (muted) => {
      appState = {
        ...appState,
        tracks: { ...appState.tracks, [name]: { ...appState.tracks[name], muted } },
      };
      debouncedSave();
    },

    onSoloToggle: (solo) => {
      appState = {
        ...appState,
        tracks: { ...appState.tracks, [name]: { ...appState.tracks[name], solo } },
      };
      debouncedSave();
    },

    onSwingChange: (swing) => {
      appState = {
        ...appState,
        tracks: { ...appState.tracks, [name]: { ...appState.tracks[name], swing } },
      };
      debouncedSave();
    },
  });

  trackRows.set(name, row);
  app.appendChild(row);
}

// ---------------------------------------------------------------------------
// Visual sync
// ---------------------------------------------------------------------------
let lastVisualStep = -1;

function updateVisualStep(step: number): void {
  if (step === lastVisualStep) return;
  lastVisualStep = step;
  for (const [, row] of trackRows) {
    const buttons = getStepButtons(row);
    buttons.forEach((btn, i) => setPlaying(btn, i === step));
  }
}
