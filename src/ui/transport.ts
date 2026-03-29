import { createKnob } from './knob.js';

export interface TransportConfig {
  bpm: number;
  masterVolume: number;
  onPlay: () => void;
  onStop: () => void;
  onBpmChange: (bpm: number) => void;
  onMasterVolumeChange: (vol: number) => void;
}

export function createTransport(config: TransportConfig): HTMLElement {
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
    label: 'Vol', min: 0, max: 1, default: config.masterVolume,
    onChange: config.onMasterVolumeChange,
  });

  bar.appendChild(playBtn);
  bar.appendChild(stopBtn);
  bar.appendChild(bpmLabel);
  bar.appendChild(volumeKnob);

  return bar;
}
