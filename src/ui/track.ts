import { InstrumentName, TrackState, FxState, STEP_COUNT } from '../state.js';
import { createKnob } from './knob.js';
import { createStepButton } from './stepButton.js';

const PARAM_RANGES: Record<string, { min: number; max: number; unit?: string }> = {
  tune: { min: 40, max: 12000 }, snap: { min: 1, max: 80, unit: 'ms' },
  decay: { min: 5, max: 3000, unit: 'ms' }, tone: { min: 0, max: 1 },
  level: { min: 0, max: 1 }, cutoff: { min: 200, max: 6000, unit: 'Hz' },
  resonance: { min: 0, max: 20 },
};

const DISPLAY_NAMES: Partial<Record<InstrumentName, string>> = {
  closedHat: 'C.Hat', openHat: 'O.Hat', blip2: 'Blip 2',
};

export interface TrackCallbacks {
  onStepToggle: (step: number, active: boolean) => void;
  onParamChange: (param: string, value: number) => void;
  onFxChange: (param: keyof FxState, value: number) => void;
  onMuteToggle: (muted: boolean) => void;
  onSoloToggle: (solo: boolean) => void;
  onSwingChange: (swing: number) => void;
}

export function createTrackRow(name: InstrumentName, trackState: TrackState, cb: TrackCallbacks): HTMLElement {
  const row = document.createElement('div');
  row.className = 'track-row';

  // Header: label + S/M
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

  // Steps — 8 groups of 4
  const stepsContainer = document.createElement('div');
  stepsContainer.className = 'track-steps';
  const groupCount = STEP_COUNT / 4;
  for (let g = 0; g < groupCount; g++) {
    const group = document.createElement('div');
    group.className = 'step-group';
    for (let s = 0; s < 4; s++) {
      const idx = g * 4 + s;
      const btn = createStepButton(trackState.steps[idx], (active) => cb.onStepToggle(idx, active));
      group.appendChild(btn);
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

  // FX knobs
  const fxPanel = document.createElement('div');
  fxPanel.className = 'track-fx';
  const fxDefs: { key: keyof FxState; label: string }[] = [
    { key: 'reverb', label: 'rev' },
    { key: 'delay', label: 'dly' },
    { key: 'distortion', label: 'dist' },
  ];
  for (const def of fxDefs) {
    fxPanel.appendChild(createKnob({
      label: def.label, min: 0, max: 1, default: trackState.fx[def.key],
      onChange: (v) => cb.onFxChange(def.key, v),
    }));
  }
  row.appendChild(fxPanel);

  return row;
}

export function getStepButtons(row: HTMLElement): HTMLButtonElement[] {
  return Array.from(row.querySelectorAll<HTMLButtonElement>('.step-btn'));
}
