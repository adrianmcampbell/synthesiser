export interface KnobConfig {
  label: string;
  min: number;
  max: number;
  default: number;
  unit?: string;
  onChange: (value: number) => void;
}

/**
 * Creates a rotary knob component.
 * Pointer drag: negative Y delta increases value.
 * 200px drag = full range.
 */
export function createKnob(config: KnobConfig): HTMLElement {
  let value = config.default;

  const container = document.createElement('div');
  container.className = 'knob';

  const labelEl = document.createElement('span');
  labelEl.className = 'knob-label';
  labelEl.textContent = config.label;

  const dial = document.createElement('div');
  dial.className = 'knob-dial';

  const indicator = document.createElement('div');
  indicator.className = 'knob-indicator';
  dial.appendChild(indicator);

  const valueEl = document.createElement('span');
  valueEl.className = 'knob-value';

  function updateDisplay() {
    const display = config.unit ? `${value.toFixed(2)}${config.unit}` : value.toFixed(2);
    valueEl.textContent = display;
    // Rotate -135deg (min) to +135deg (max)
    const pct = (value - config.min) / (config.max - config.min);
    const deg = -135 + pct * 270;
    dial.style.transform = `rotate(${deg}deg)`;
  }

  let startY = 0;
  let startValue = value;

  function onPointerMove(e: PointerEvent) {
    const deltaY = startY - e.clientY; // negative Y = increase
    const range = config.max - config.min;
    const delta = (deltaY / 200) * range;
    value = Math.min(config.max, Math.max(config.min, startValue + delta));
    updateDisplay();
    config.onChange(value);
  }

  function onPointerUp(e: PointerEvent) {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    (e.target as HTMLElement).releasePointerCapture(e.pointerId);
  }

  dial.addEventListener('pointerdown', (e: PointerEvent) => {
    startY = e.clientY;
    startValue = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    document.addEventListener('pointermove', onPointerMove);
    document.addEventListener('pointerup', onPointerUp);
    e.preventDefault();
  });

  container.appendChild(labelEl);
  container.appendChild(dial);
  container.appendChild(valueEl);

  updateDisplay();
  return container;
}
