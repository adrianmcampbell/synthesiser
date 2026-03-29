import './style.css';

import { AppState, INSTRUMENT_NAMES, InstrumentName, defaultState } from './state.js';
import { getAudioContext, resumeAudioContext } from './audio/context.js';
import { getMasterGain, setMasterVolume } from './audio/mixer.js';
import { createKick } from './audio/kick.js';
import { createSnare } from './audio/snare.js';
import { createClap } from './audio/clap.js';
import { createHiHat } from './audio/hihat.js';
import { createTom } from './audio/tom.js';
import { createBlip } from './audio/blip.js';
import { createBlip3 } from './audio/blip3.js';
import { createSequencer, Voices } from './sequencer.js';
import { createTransport } from './ui/transport.js';
import { createTrackRow, getStepButtons } from './ui/track.js';
import { setPlaying } from './ui/stepButton.js';

// Always start fresh
let appState: AppState = defaultState();

const audioContext = getAudioContext();
const masterGain = getMasterGain();

const kick  = createKick(audioContext, masterGain);
const snare = createSnare(audioContext, masterGain);
const clap  = createClap(audioContext, masterGain);
const hihat = createHiHat(audioContext, masterGain);
const tom   = createTom(audioContext, masterGain);
const blip  = createBlip(audioContext, masterGain);
const blip2 = createBlip(audioContext, masterGain);
const blip3 = createBlip3(audioContext, masterGain);

setMasterVolume(appState.masterVolume);

const voices: Voices = {
  kick, snare, clap, closedHat: hihat, openHat: hihat, tom, blip, blip2, blip3,
};

const sequencer = createSequencer(audioContext, () => appState, voices);

const app = document.getElementById('app') ?? document.body;

const headerEl = document.createElement('div');
headerEl.className = 'app-header';
const titleEl = document.createElement('span');
titleEl.className = 'app-title';
titleEl.textContent = 'Hypno Drum Machine v0.1';
headerEl.appendChild(titleEl);
app.appendChild(headerEl);

const transport = createTransport({
  bpm: appState.bpm,
  masterVolume: appState.masterVolume,
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
  onBpmChange: (bpm) => { appState = { ...appState, bpm }; },
  onMasterVolumeChange: (vol) => {
    appState = { ...appState, masterVolume: vol };
    setMasterVolume(vol);
  },
});
app.appendChild(transport);

const trackRows = new Map<InstrumentName, HTMLElement>();

for (const name of INSTRUMENT_NAMES) {
  const row = createTrackRow(name, appState.tracks[name], {
    onStepToggle: (step, active) => {
      const steps = [...appState.tracks[name].steps];
      steps[step] = active;
      appState = { ...appState, tracks: { ...appState.tracks, [name]: { ...appState.tracks[name], steps } } };
    },
    onParamChange: (param, value) => {
      appState = { ...appState, tracks: { ...appState.tracks, [name]: { ...appState.tracks[name], params: { ...appState.tracks[name].params, [param]: value } } } };
    },
    onMuteToggle: (muted) => {
      appState = { ...appState, tracks: { ...appState.tracks, [name]: { ...appState.tracks[name], muted } } };
    },
    onSoloToggle: (solo) => {
      appState = { ...appState, tracks: { ...appState.tracks, [name]: { ...appState.tracks[name], solo } } };
    },
    onSwingChange: (swing) => {
      appState = { ...appState, tracks: { ...appState.tracks, [name]: { ...appState.tracks[name], swing } } };
    },
  });
  trackRows.set(name, row);
  app.appendChild(row);
}

let lastVisualStep = -1;
function updateVisualStep(step: number): void {
  if (step === lastVisualStep) return;
  lastVisualStep = step;
  for (const [, row] of trackRows) {
    const buttons = getStepButtons(row);
    buttons.forEach((btn, i) => setPlaying(btn, i === step));
  }
}
