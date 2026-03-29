import { InstrumentName, TrackState, STEP_COUNT } from '../state.js';
import { createKnob } from './knob.js';
import { createStepButton } from './stepButton.js';

const PARAM_RANGES: Record<string, { min: number; max: number; unit?: string }> = {
  tune: { min: 40, max: 12000 }, snap: { min: 1, max: 80, unit: 'ms' },
  decay: { min: 5, max: 3000, unit: 'ms' }, tone: { min: 0, max: 1 },
  level: { min: 0, max: 1 }, cutoff: { min: 100, max: 4000, unit: 'Hz' },
  resonance: { min: 0, max: 25 }, feedback: { min: 0, max: 1 },
};

const DISPLAY_NAMES: Partial<Record<InstrumentName, string>> = {
  closedHat: 'C.Hat', openHat: 'O.Hat', blip2: 'Blip 2', blip3: 'Blip 3',
};

export interface TrackCallbacks {
  onStepToggle: (step: number, active: boolean) => void;
  onParamChange: (param: string, value: number) => void;
  onMuteToggle: (muted: boolean) => void;
  onSoloToggle: (solo: boolean) => void;
  onSwingChange: (swing: number) => void;
}

export function createTrackRow(name: InstrumentName, trackState: TrackState, cb: TrackCallbacks): HTMLElement {
  const row = document.createElement('div');
  row.className = 'track-row';

  // Header
  const header = document.createElement('div');
  header.className = 'track-header';
  const label = document.createElement('span');
  label.className = 'track-label';
  label.textContent = DISPLAY_NAMES[name] ?? name.charAt(0).toUpperCase() + name.slice(1);

  const btnRow = document.createElement('div');
  btnRow.className = 'track-btn-row';

  const soloBtn = document.createElement('button');
  soloBtn.className = 'track-solo-btn';
  soloBtn.textContent = 'S';
  if (trackState.solo) soloBtn.dataset.active = '';
  soloBtn.addEventListener('click', () => {
    const on = soloBtn.dataset.active !== undefined;
    if (on) { delete soloBtn.dataset.active; cb.onSoloToggle(false); }
    else { soloBtn.dataset.active = ''; cb.onSoloToggle(true); }
  });

  const muteBtn = document.createElement('button');
  muteBtn.className = 'track-mute-btn';
  muteBtn.textContent = 'M';
  if (trackState.muted) muteBtn.dataset.active = '';
  muteBtn.addEventListener('click', () => {
    const on = muteBtn.dataset.active !== undefined;
    if (on) { delete muteBtn.dataset.active; cb.onMuteToggle(false); }
    else { muteBtn.dataset.active = ''; cb.onMuteToggle(true); }
  });

  btnRow.appendChild(soloBtn);
  btnRow.appendChild(muteBtn);
  header.appendChild(label);
  header.appendChild(btnRow);
  row.appendChild(header);

  // Steps
  const stepsContainer = document.createElement('div');
  stepsContainer.className = 'track-steps';
  for (let g = 0; g < STEP_COUNT / 4; g++) {
    const group = document.createElement('div');
    group.className = 'step-group';
    for (let s = 0; s < 4; s++) {
      const idx = g * 4 + s;
      group.appendChild(createStepButton(trackState.steps[idx], (active) => cb.onStepToggle(idx, active)));
    }
    stepsContainer.appendChild(group);
  }
  row.appendChild(stepsContainer);

  // Synth knobs
  const synthPanel = document.createElement('div');
  synthPanel.className = 'track-knobs';
  for (const [param, value] of Object.entries(trackState.params)) {
    const range = PARAM_RANGES[param] ?? { min: 0, max: 1 };
    synthPanel.appendChild(createKnob({
      label: param, min: range.min, max: range.max, default: value, unit: range.unit,
      onChange: (v) => cb.onParamChange(param, v),
    }));
  }
  synthPanel.appendChild(createKnob({
    label: 'swing', min: 0, max: 0.33, default: trackState.swing,
    onChange: (v) => cb.onSwingChange(v),
  }));
  row.appendChild(synthPanel);

  return row;
}

export function getStepButtons(row: HTMLElement): HTMLButtonElement[] {
  return Array.from(row.querySelectorAll<HTMLButtonElement>('.step-btn'));
}
