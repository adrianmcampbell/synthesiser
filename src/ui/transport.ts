import { createKnob } from './knob.js';
import { MasterFxState } from '../state.js';

export interface TransportConfig {
  bpm: number;
  masterVolume: number;
  masterFx: MasterFxState;
  onPlay: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onMasterVolumeChange: (vol: number) => void;
  onMasterFxChange: (param: keyof MasterFxState, value: number) => void;
}

export function createTransport(config: TransportConfig): HTMLElement {
  const wrapper = document.createElement('div');
  wrapper.className = 'transport-wrapper';

  // --- Top bar: play/stop + BPM + volume ---
  const bar = document.createElement('div');
  bar.className = 'transport';

  const playBtn = document.createElement('button');
  playBtn.id = 'play-btn';
  playBtn.textContent = '▶';
  playBtn.addEventListener('click', config.onPlay);

  const stopBtn = document.createElement('button');
  stopBtn.id = 'stop-btn';
  stopBtn.textContent = '■';
  stopBtn.addEventListener('click', config.onStop);

  const bpmLabel = document.createElement('label');
  bpmLabel.className = 'transport-bpm-label';
  const bpmText = document.createElement('span');
  bpmText.textContent = `BPM: ${config.bpm}`;
  const bpmInput = document.createElement('input');
  bpmInput.type = 'range';
  bpmInput.min = '60';
  bpmInput.max = '200';
  bpmInput.value = String(config.bpm);
  bpmInput.addEventListener('input', () => {
    const val = Number(bpmInput.value);
    bpmText.textContent = `BPM: ${val}`;
    config.onBpmChange(val);
  });
  bpmLabel.appendChild(bpmText);
  bpmLabel.appendChild(bpmInput);

  const volumeKnob = createKnob({
    label: 'Volume',
    min: 0,
    max: 1,
    default: config.masterVolume,
    onChange: config.onMasterVolumeChange,
  });

  bar.appendChild(playBtn);
  bar.appendChild(stopBtn);
  bar.appendChild(bpmLabel);
  bar.appendChild(volumeKnob);
  wrapper.appendChild(bar);

  // --- Master FX section ---
  const fxSection = document.createElement('div');
  fxSection.className = 'master-fx-section';

  const fxTitle = document.createElement('div');
  fxTitle.className = 'section-title';
  fxTitle.textContent = 'MASTER FX';
  fxSection.appendChild(fxTitle);

  const fxBody = document.createElement('div');
  fxBody.className = 'section-body knob-row';

  const fxDefs: { key: keyof MasterFxState; label: string; min: number; max: number; unit?: string }[] = [
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
      default: config.masterFx[def.key],
      unit: def.unit,
      onChange: (v) => config.onMasterFxChange(def.key, v),
    });
    fxBody.appendChild(knob);
  }

  fxSection.appendChild(fxBody);
  wrapper.appendChild(fxSection);

  return wrapper;
}
