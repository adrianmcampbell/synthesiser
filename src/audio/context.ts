/**
 * Lazy-initialised AudioContext singleton.
 *
 * The context is NOT created at module load time — it is created on the first
 * call to `getAudioContext()`. This complies with browser autoplay policies
 * which require audio contexts to be created (or resumed) inside a user
 * gesture handler (Requirement 9.3).
 */

let _ctx: AudioContext | null = null;

/** Return the shared AudioContext, creating it on the first call. */
export function getAudioContext(): AudioContext {
  if (!_ctx) {
    _ctx = new AudioContext();
  }
  return _ctx;
}

/**
 * Resume the AudioContext if it is currently suspended.
 * Call this inside every user-gesture handler that triggers audio
 * (Requirement 9.4).
 */
export async function resumeAudioContext(): Promise<void> {
  const ctx = getAudioContext();
  if (ctx.state === 'suspended') {
    await ctx.resume();
  }
}
