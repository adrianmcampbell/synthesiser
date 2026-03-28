/**
 * Creates a step toggle button.
 * Toggles `data-active` attribute on click.
 * `data-playing` attribute is set externally for playback highlight.
 */
export function createStepButton(
  active: boolean,
  onChange: (active: boolean) => void
): HTMLButtonElement {
  const btn = document.createElement('button');
  btn.className = 'step-btn';

  if (active) {
    btn.dataset.active = '';
  }

  btn.addEventListener('click', () => {
    if (btn.dataset.active !== undefined) {
      delete btn.dataset.active;
      onChange(false);
    } else {
      btn.dataset.active = '';
      onChange(true);
    }
  });

  return btn;
}

/** Sets or clears the `data-playing` attribute for visual playback highlight. */
export function setPlaying(button: HTMLButtonElement, playing: boolean): void {
  if (playing) {
    button.dataset.playing = '';
  } else {
    delete button.dataset.playing;
  }
}
