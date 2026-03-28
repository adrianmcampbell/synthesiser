# Design Document: Hypnotic Techno Drum Synthesiser

## Overview

A single-page browser application built with vanilla TypeScript and the Web Audio API. No frameworks, no samples — all audio is synthesised in real time. The architecture separates the sequencer engine, synthesis voices, state management, and UI rendering into distinct modules that communicate through a shared application state object.

The implementation targets modern browsers (Chrome, Firefox, Safari) and runs entirely client-side with no backend.

---

## Technology Stack

- **Language**: TypeScript (compiled to ES modules)
- **Build tool**: Vite
- **Audio**: Web Audio API (native browser)
- **Persistence**: localStorage
- **Testing**: Vitest + fast-check (property-based tests)
- **UI**: Vanilla DOM manipulation, CSS custom properties for theming

---

## Architecture

```
src/
  main.ts              # Entry point — wires everything together
  state.ts             # AppState type, default state, serialisation
  sequencer.ts         # Sequencer engine (scheduling loop)
  audio/
    context.ts         # AudioContext singleton
    mixer.ts           # Master gain node
    kick.ts            # Kick synthesis voice
    snare.ts           # Snare synthesis voice
    clap.ts            # Clap synthesis voice
    hihat.ts           # Closed/Open hat synthesis voice
    tom.ts             # Tom synthesis voice
    blip.ts            # Blip synthesis voice
  ui/
    transport.ts       # Play/stop/BPM/swing controls
    track.ts           # Single track row (steps + knobs)
    knob.ts            # Rotary knob component
    stepButton.ts      # Step toggle button component
  persistence.ts       # localStorage save/load
```

---

## Data Model

### AppState

```typescript
interface AppState {
  bpm: number;                        // 60–200, default 130
  swing: number;                      // 0–0.33, default 0
  masterVolume: number;               // 0–1, default 0.8
  tracks: Record<InstrumentName, TrackState>;
}

type InstrumentName = 'kick' | 'snare' | 'clap' | 'closedHat' | 'openHat' | 'tom' | 'blip';

interface TrackState {
  steps: boolean[];                   // length === 16
  params: Record<string, number>;     // keyed by param name
}
```

### Default Parameter Values

| Instrument  | Params                                      |
|-------------|---------------------------------------------|
| kick        | tune:80, snap:10, decay:800, level:0.9      |
| snare       | tune:200, tone:0.5, decay:200, level:0.8    |
| clap        | tone:1200, decay:120, level:0.75            |
| closedHat   | tune:8000, decay:60, level:0.7              |
| openHat     | tune:7000, decay:600, level:0.65            |
| tom         | tune:120, decay:400, level:0.75             |
| blip        | tune:800, tone:0.3, decay:80, level:0.7     |

---

## Sequencer Engine

The sequencer uses a lookahead scheduler pattern (as described by Chris Wilson) to schedule Web Audio API events ahead of time, decoupling audio timing from the JS event loop.

```
scheduleAheadTime = 0.1s   (schedule 100ms ahead)
lookaheadInterval = 25ms   (setInterval tick)
```

### Scheduling Loop (pseudocode)

```
while nextStepTime < audioContext.currentTime + scheduleAheadTime:
  for each track:
    if track.steps[currentStep] is active:
      trigger instrument voice at nextStepTime
  advance currentStep (mod 16)
  compute nextStepTime based on BPM and swing
```

### Swing Calculation

```
stepDuration = 60 / bpm / 4   (16th note duration in seconds)
if currentStep is even:
  scheduledTime = baseTime
else:
  scheduledTime = baseTime + stepDuration * swing
```

### UI Sync

A `requestAnimationFrame` loop reads `audioContext.currentTime` and maps it back to the current visual step index for highlight rendering. This keeps the visual indicator in sync with the audio clock without coupling them.

---

## Synthesis Voice Design

Each voice is a factory function that accepts the AudioContext and master gain node, and returns a `trigger(time: number, params: Record<string, number>)` function. Voices create new AudioNode graphs on each trigger call (fire-and-forget), so retriggering never cuts off a playing voice.

### Kick

```
OscillatorNode (sine)
  → frequency envelope: tune → 40Hz over snap ms
  → GainNode (amplitude envelope: 1 → 0 over decay ms)
  → master gain
```

### Snare

```
OscillatorNode (sine, tune Hz)
  → GainNode (body envelope, decay ms)
  → mix GainNode

BufferSourceNode (white noise)
  → BiquadFilterNode (highpass, 1000Hz)
  → GainNode (noise envelope, decay ms)
  → mix GainNode

mix GainNode (tone controls body/noise ratio)
  → master gain
```

### Clap

Three noise bursts with staggered start times (0ms, 10ms, 20ms):

```
for each burst (t = 0, 10ms, 20ms):
  BufferSourceNode (white noise, short buffer)
    → BiquadFilterNode (bandpass, tone Hz, Q=2)
    → GainNode (fast attack, decay ms envelope)
    → master gain
```

### Closed Hat / Open Hat

```
6× OscillatorNode (square, frequencies: 40Hz × [2,3,4.16,5.43,6.79,8.21])
  → GainNode (mix, gain 1/6 each)
  → BiquadFilterNode (highpass, tune Hz)
  → GainNode (amplitude envelope, decay ms)
  → master gain
```

Open hat uses the same graph but with a longer decay range and independent state.

### Tom

```
OscillatorNode (sine)
  → frequency envelope: tune → tune*0.3 over decay*0.3 ms
  → GainNode (amplitude envelope: 1 → 0 over decay ms)
  → master gain
```

### Blip

```
OscillatorNode (sine, tune Hz)
  → WaveShaperNode (distortion curve, amount driven by tone param)
  → GainNode (amplitude envelope: 1 → 0 over decay ms)
  → master gain
```

---

## UI Component Design

### Track Row

Each track row renders:
- Instrument name label
- 16 step buttons (grouped 4×4 visually)
- Parameter knobs (instrument-specific)

### Knob Component

A `<div>` with CSS `transform: rotate()` driven by a pointer drag interaction. Maps a pixel delta to a normalised value, then scales to the parameter range.

```typescript
interface KnobConfig {
  label: string;
  min: number;
  max: number;
  default: number;
  unit?: string;
  onChange: (value: number) => void;
}
```

### Step Button

A `<button>` that toggles `data-active` attribute on click. Active state styled via CSS attribute selector.

### Transport

- Play button: creates/resumes AudioContext, starts scheduler
- Stop button: clears scheduler interval, resets step to 0
- BPM input: `<input type="range">` 60–200
- Swing knob: 0–33%
- Master volume knob: 0–1

---

## Persistence

```typescript
const STORAGE_KEY = 'hypno-drum-state';

function saveState(state: AppState): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function loadState(): AppState | null {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as AppState;
  } catch {
    return null;
  }
}
```

State is saved on every step toggle and every knob change via a debounced write (50ms debounce to avoid excessive writes during knob drag).

---

## Correctness Properties

### Property 1: Step count invariant
For any track in any AppState (initial, after load, after any mutation), `track.steps.length === 16`.

### Property 2: BPM range invariant
For any BPM value set through the application, the stored BPM satisfies `60 ≤ bpm ≤ 200`.

### Property 3: Swing range invariant
For any swing value set through the application, the stored swing satisfies `0 ≤ swing ≤ 0.33`.

### Property 4: Parameter range invariant
For any parameter value set through a knob, the stored value satisfies `min ≤ value ≤ max` for that parameter's configured range.

### Property 5: Round-trip serialisation
For any valid AppState `s`, `deserialise(serialise(s))` produces a state equivalent to `s` (same BPM, swing, masterVolume, all track steps and params).

### Property 6: Swing step timing
For any step index `i` and swing value `sw` in [0, 0.33], the scheduled time offset for odd steps equals `stepDuration * sw` and for even steps equals `0`.

### Property 7: Level parameter normalisation
For any instrument, the Level parameter value stored in state is always in [0, 1].

---

## Visual Design

Dark industrial aesthetic:
- Background: `#0a0a0a`
- Panel: `#111111`
- Active step: amber `#f5a623`
- Playing step highlight: white `#ffffff`
- Inactive step: `#2a2a2a`
- Text: `#cccccc`
- Knob track: `#333333`
- Knob fill: `#f5a623`

Font: monospace system font stack.
