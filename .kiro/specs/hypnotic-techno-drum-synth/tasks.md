# Implementation Plan: Hypnotic Techno Drum Synthesiser

## Overview

Implement a browser-based drum synthesiser using TypeScript, Vite, and the Web Audio API. Build incrementally: project scaffold → audio context + mixer → synthesis voices → sequencer engine → UI components → persistence → wiring.

## Tasks

- [x] 1. Scaffold project and define core types
  - Initialise Vite + TypeScript project with Vitest and fast-check
  - Create `src/state.ts` defining `AppState`, `TrackState`, `InstrumentName` types and `defaultState()` factory
  - Create `src/audio/context.ts` exporting the AudioContext singleton (lazy-init on first call)
  - Create `src/audio/mixer.ts` exporting the master GainNode connected to `audioContext.destination`
  - _Requirements: 1.1, 9.1, 9.3_

- [x] 2. Implement state management and persistence
  - [x] 2.1 Implement `saveState` and `loadState` in `src/persistence.ts` using `localStorage`
    - `saveState` serialises AppState to JSON and writes to `hypno-drum-state`
    - `loadState` reads, parses, and returns AppState or null on missing/invalid data
    - _Requirements: 10.1, 10.2, 10.3_

  - [x] 2.2 Write property test for round-trip serialisation
    - **Property 5: Round-trip serialisation**
    - **Validates: Requirements 10.4**
    - Generate arbitrary AppState values with fast-check and assert `loadState(saveState(s))` equals `s`

  - [x] 2.3 Implement `validateState` to clamp/coerce loaded state into valid ranges
    - Clamp BPM to [60, 200], swing to [0, 0.33], masterVolume to [0, 1], all params to their configured ranges
    - Ensure every track has exactly 16 steps (pad or truncate if needed)
    - _Requirements: 1.1, 1.2, 10.2_

  - [x] 2.4 Write property tests for state invariants
    - **Property 1: Step count invariant** — for any loaded state, all tracks have exactly 16 steps
    - **Property 2: BPM range invariant** — BPM always in [60, 200] after validateState
    - **Property 3: Swing range invariant** — swing always in [0, 0.33] after validateState
    - **Property 4: Parameter range invariant** — all param values within configured min/max
    - **Property 7: Level parameter normalisation** — level always in [0, 1]
    - **Validates: Requirements 1.1, 1.2, 1.8, 10.4**

- [x] 3. Implement synthesis voices
  - [x] 3.1 Implement Kick voice in `src/audio/kick.ts`
    - Factory function returning `trigger(time, params)` — creates sine oscillator with pitch envelope (tune → 40Hz over snap ms) and amplitude envelope (decay ms)
    - Each trigger creates a new node graph (fire-and-forget)
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5, 2.6, 2.7_

  - [x] 3.2 Implement Snare voice in `src/audio/snare.ts`
    - Mix sine oscillator body with highpass-filtered white noise; independent envelopes; tone param controls body/noise ratio
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5, 3.6_

  - [x] 3.3 Implement Clap voice in `src/audio/clap.ts`
    - Three staggered noise bursts (0ms, 10ms, 20ms) through bandpass filter (tone Hz); each with fast attack + configurable decay envelope
    - _Requirements: 4.1, 4.2, 4.3, 4.4, 4.5_

  - [x] 3.4 Implement Hi-Hat voices in `src/audio/hihat.ts`
    - Shared metallic oscillator mix (6× square waves at inharmonic ratios) through highpass filter (tune Hz)
    - `triggerClosed(time, params)` — short decay [10ms–200ms]
    - `triggerOpen(time, params)` — longer decay [100ms–2000ms], retrigger resets envelope
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5, 5.6, 5.7, 5.8, 5.9_

  - [x] 3.5 Implement Tom voice in `src/audio/tom.ts`
    - Sine oscillator with pitch envelope (tune → tune×0.3 over decay×0.3 ms) and amplitude envelope
    - _Requirements: 6.1, 6.2, 6.3, 6.4, 6.5_

  - [x] 3.6 Implement Blip voice in `src/audio/blip.ts`
    - Sine oscillator through WaveShaperNode (distortion amount driven by tone param) with fast amplitude envelope
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 4. Checkpoint — verify synthesis voices compile and trigger without errors
  - Ensure all voice modules export correctly typed trigger functions
  - Ensure all tests pass, ask the user if questions arise.

- [x] 5. Implement sequencer engine
  - [x] 5.1 Implement lookahead scheduler in `src/sequencer.ts`
    - `start()` — launches `setInterval` (25ms) scheduling loop using `audioContext.currentTime`
    - `stop()` — clears interval, resets `currentStep` to 0
    - Schedules voice triggers 100ms ahead using `nextStepTime`
    - _Requirements: 1.3, 1.4, 1.5, 1.6, 1.7_

  - [x] 5.2 Implement swing timing in the scheduler
    - Even steps scheduled at `baseTime`; odd steps at `baseTime + stepDuration * swing`
    - _Requirements: 1.8_

  - [x] 5.3 Write property test for swing step timing
    - **Property 6: Swing step timing**
    - **Validates: Requirements 1.8**
    - For arbitrary step index and swing in [0, 0.33], assert correct time offset formula

  - [x] 5.4 Implement `requestAnimationFrame` visual sync loop
    - Maps `audioContext.currentTime` back to a visual step index and exposes it for UI rendering
    - _Requirements: 1.9, 8.11_

- [x] 6. Implement UI components
  - [x] 6.1 Implement `KnobComponent` in `src/ui/knob.ts`
    - `<div>` with pointer drag interaction; maps pixel delta to [min, max] range; calls `onChange` on change
    - Accepts `KnobConfig` (label, min, max, default, unit, onChange)
    - _Requirements: 8.5, 8.6_

  - [x] 6.2 Implement `StepButtonComponent` in `src/ui/stepButton.ts`
    - `<button>` toggling `data-active` on click; visually distinct active/inactive states via CSS
    - _Requirements: 8.3, 8.4_

  - [x] 6.3 Implement `TrackRowComponent` in `src/ui/track.ts`
    - Renders instrument label, 16 step buttons grouped 4×4, and instrument-specific knob panel
    - Accepts current track state and callbacks for step toggle and param change
    - _Requirements: 8.1, 8.2, 8.5, 8.10_

  - [x] 6.4 Implement `TransportComponent` in `src/ui/transport.ts`
    - Play/stop buttons, BPM range input (60–200), swing knob (0–33%), master volume knob (0–1)
    - _Requirements: 8.7, 8.8, 8.9_

- [x] 7. Checkpoint — verify UI components render correctly
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Wire everything together in `src/main.ts`
  - [x] 8.1 Initialise state from `loadState()` or `defaultState()`
    - _Requirements: 10.2, 10.3_

  - [x] 8.2 Instantiate all synthesis voices and connect to mixer
    - Resume AudioContext on first user interaction (play button click)
    - _Requirements: 9.1, 9.3, 9.4_

  - [x] 8.3 Connect sequencer to voice triggers and state
    - Sequencer reads `appState.tracks` on each step; calls appropriate voice trigger with current params
    - _Requirements: 1.5, 1.6_

  - [x] 8.4 Connect UI components to state mutations and persistence
    - Step toggle → update `appState`, call `saveState` (debounced 50ms)
    - Knob change → update `appState`, update voice param, call `saveState` (debounced 50ms)
    - Transport controls → start/stop sequencer, update BPM/swing in state
    - _Requirements: 8.3, 8.6, 10.1_

  - [x] 8.5 Connect visual step highlight to `requestAnimationFrame` sync loop
    - Update step button `data-playing` attribute based on current visual step index
    - _Requirements: 1.9, 8.11_

  - [x] 8.6 Apply dark industrial CSS theme
    - Background `#0a0a0a`, active step amber `#f5a623`, playing step white `#ffffff`, inactive `#2a2a2a`
    - _Requirements: 8.4_

- [x] 9. Final checkpoint — full integration
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for a faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests use fast-check to validate universal correctness properties
- All audio node graphs are fire-and-forget — nodes self-disconnect via `onended`
