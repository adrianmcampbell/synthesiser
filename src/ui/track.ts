import { InstrumentName, TrackState, FxState } from '../state.js';
import { createKnob } from './knob.js';
import { createStepButton } from './stepButton.js';

/** Synthesis param ranges per instrument. */
const PARAM_RANGES: Record<string, { min: number; max: number; unit?: string }> = {
  tune:      { min: 40,   max: 12000 },
  snap:      { min: 1,    max: 80,    unit: 'ms' },
  decay:     { min: 5,    max: 3000,  unit: 'ms' },
  tone:      { min: 0,    max: 1 },
  level:     { min: 0,    max: 1 },
  cutoff:    { min: 200,  max: 8000,  unit: 'Hz' },
  resonance: { min: 0,    max: 30 },
  envAmt:    { min: 0,    max: 1 },
};

function createSection(title: string, className: string): { section: HTMLElement; body: HTMLElement } {
  const section = document.createElement('div');
  section.className = `track-section ${className}`;
  const header = document.createElement('div');
  header.className = 'section-title';
  header.textContent = title;
  const body = document.createElement('div');
  body.className = 'section-body';
  section.appendChild(header);
  section.appendChild(body);
  return { section, body };
}

export interface TrackCallbacks {
  onStepToggle: (step: number, active: boolean) => void;
  onParamChange: (param: string, value: number) => void;
  onFxChange: (param: keyof FxState, value: number) => void;
  onMuteToggle: (muted: boolean) => void;
  onSoloToggle: (solo: boolean) => void;
  onSwingChange: (swing: number) => void;
}

export function createTrackRow(
  name: InstrumentName,
  trackState: TrackState,
  callbacks: TrackCallbacks,
): HTMLElement {
  const row = document.createElement('div');
  row.className = 'track-row';

  // --- Track header: label + S/M buttons ---
  const header = document.createElement('div');
  header.className = 'track-header';

  const label = document.createElement('span');
  label.className = 'track-label';
  label.textContent = name === 'closedHat' ? 'C.Hat'
    : name === 'openHat' ? 'O.Hat'
    : name.charAt(0).toUpperCase() + name.slice(1);

  const soloBtn = document.createElement('button');
  soloBtn.className = 'track-solo-btn';
  soloBtn.textContent = 'S';
  soloBtn.title = 'Solo';
  if (trackState.solo) soloBtn.dataset.active = '';
  soloBtn.addEventListener('click', () => {
    const isActive = soloBtn.dataset.active !== undefined;
    if (isActive) {
      delete soloBtn.dataset.active;
      callbacks.onSoloToggle(false);
    } else {
      soloBtn.dataset.active = '';
      callbacks.onSoloToggle(true);
    }
  });

  const muteBtn = document.createElement('button');
  muteBtn.className = 'track-mute-btn';
  muteBtn.textContent = 'M';
  muteBtn.title = 'Mute';
  if (trackState.muted) muteBtn.dataset.active = '';
  muteBtn.addEventListener('click', () => {
    const isActive = muteBtn.dataset.active !== undefined;
    if (isActive) {
      delete muteBtn.dataset.active;
      callbacks.onMuteToggle(false);
    } else {
      muteBtn.dataset.active = '';
      callbacks.onMuteToggle(true);
    }
  });

  header.appendChild(label);
  header.appendChild(soloBtn);
  header.appendChild(muteBtn);
  row.appendChild(header);

  // --- Step sequencer section ---
  const { section: seqSection, body: seqBody } = createSection('STEPS', 'section-steps');
  const stepsContainer = document.createElement('div');
  stepsContainer.className = 'track-steps';
  for (let g = 0; g < 4; g++) {
    const group = document.createElement('div');
    group.className = 'step-group';
    for (let s = 0; s < 4; s++) {
      const stepIndex = g * 4 + s;
      const btn = createStepButton(trackState.steps[stepIndex], (active) => {
        callbacks.onStepToggle(stepIndex, active);
      });
      group.appendChild(btn);
    }
    stepsContainer.appendChild(group);
  }
  seqBody.appendChild(stepsContainer);
  row.appendChild(seqSection);

  // --- Synth params section ---
  const { section: synthSection, body: synthBody } = createSection('SYNTH', 'section-synth');
  synthBody.className += ' knob-row';
  for (const [param, value] of Object.entries(trackState.params)) {
    const range = PARAM_RANGES[param] ?? { min: 0, max: 1 };
    const knob = createKnob({
      label: param,
      min: range.min,
      max: range.max,
      default: value,
      unit: range.unit,
      onChange: (v) => callbacks.onParamChange(param, v),
    });
    synthBody.appendChild(knob);
  }
  // Swing knob per track
  const swingKnob = createKnob({
    label: 'swing',
    min: 0,
    max: 0.33,
    default: trackState.swing,
    onChange: (v) => callbacks.onSwingChange(v),
  });
  synthBody.appendChild(swingKnob);
  row.appendChild(synthSection);

  // --- FX section ---
  const { section: fxSection, body: fxBody } = createSection('FX', 'section-fx');
  fxBody.className += ' knob-row';

  const fxDefs: { key: keyof FxState; label: string; min: number; max: number; unit?: string }[] = [
    { key: 'reverbMix',  label: 'reverb',  min: 0,    max: 1 },
    { key: 'delayMix',   label: 'delay',   min: 0,    max: 1 },
    { key: 'delayTime',  label: 'dly.t',   min: 0.01, max: 1, unit: 's' },
    { key: 'distortion', label: 'dist',    min: 0,    max: 1 },
  ];

  for (const def of fxDefs) {
    const knob = createKnob({
      label: def.label,
      min: def.min,
      max: def.max,
      default: trackState.fx[def.key],
      unit: def.unit,
      onChange: (v) => callbacks.onFxChange(def.key, v),
    });
    fxBody.appendChild(knob);
  }
  row.appendChild(fxSection);

  return row;
}

/** Returns all step buttons within a track row in order. */
export function getStepButtons(row: HTMLElement): HTMLButtonElement[] {
  return Array.from(row.querySelectorAll<HTMLButtonElement>('.step-btn'));
}
