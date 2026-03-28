# Requirements Document

## Introduction

A browser-based drum synthesiser designed for hypnotic techno music production. The synthesiser generates all drum sounds programmatically using the Web Audio API — no samples. The interface follows the Roland TR-8 step sequencer paradigm: a 16-step grid per instrument with per-instrument knobs for tuning, decay, and level. The sound palette targets the dark, industrial, minimal aesthetic of artists like Rene Wise, Ignez, Yanamaste, and Alarico — long sustaining kicks, metallic hi-hats, gritty snares, and abstract percussive textures.

## Glossary

- **Sequencer**: The core engine that advances through 16 steps at a defined BPM and triggers active steps.
- **Step**: A single rhythmic slot in a 16-step pattern. Each step is either active (on) or inactive (off).
- **Pattern**: A complete 16-step sequence for one instrument track.
- **Track**: One instrument lane in the sequencer, containing a Pattern and synthesis parameters.
- **Instrument**: A synthesised drum voice — Kick, Snare, Clap, Closed_Hat, Open_Hat, Tom, or Blip.
- **Kick**: A synthesised bass drum voice using sine/triangle oscillator with pitch envelope.
- **Snare**: A synthesised snare voice combining a tonal body with filtered noise.
- **Clap**: A synthesised clap voice using layered noise bursts with short attack.
- **Closed_Hat**: A synthesised closed hi-hat voice using metallic noise through a high-pass filter with short decay.
- **Open_Hat**: A synthesised open hi-hat voice using metallic noise with longer, adjustable decay.
- **Tom**: A synthesised tom voice using a pitched oscillator with pitch and amplitude envelope.
- **Blip**: A synthesised abstract percussive voice — short tonal or noise-based textures suited to hypnotic techno (e.g. rimshots, cowbells, metallic blips, industrial clicks).
- **Synthesis_Engine**: The Web Audio API graph responsible for generating all audio for a given Instrument on demand.
- **Step_Button**: A UI toggle button representing one Step in a Pattern.
- **Parameter_Knob**: A rotary UI control that maps to a synthesis parameter (e.g. Tune, Decay, Level, Tone, Snap).
- **Transport**: The playback controls — play, stop, and BPM setting.
- **BPM**: Beats per minute. Controls the tempo of the Sequencer.
- **Swing**: A timing offset applied to even-numbered steps to create a shuffle feel.
- **Master_Volume**: The global output gain applied to the final mix.
- **Web_Audio_API**: The browser-native audio processing API used as the sole audio backend.

---

## Requirements

### Requirement 1: Step Sequencer Engine

**User Story:** As a producer, I want a 16-step sequencer that plays back drum patterns in real time, so that I can program rhythmic patterns for hypnotic techno tracks.

#### Acceptance Criteria

1. THE Sequencer SHALL support exactly 16 steps per Track.
2. THE Sequencer SHALL support a BPM range of 60 to 200, with a default of 130.
3. WHEN the Transport play control is activated, THE Sequencer SHALL begin advancing through steps from the current position at the configured BPM.
4. WHEN the Transport stop control is activated, THE Sequencer SHALL halt playback and reset the current step to step 1.
5. WHEN the Sequencer advances to a step and that step is active, THE Sequencer SHALL trigger the Synthesis_Engine for the corresponding Instrument.
6. WHEN the Sequencer advances to a step and that step is inactive, THE Sequencer SHALL produce no audio output for that Instrument on that step.
7. THE Sequencer SHALL use the Web Audio API clock (AudioContext.currentTime) for step scheduling to maintain timing accuracy independent of the JavaScript event loop.
8. WHERE Swing is enabled, THE Sequencer SHALL delay even-numbered steps by a configurable offset between 0% and 33% of one step duration.
9. THE Sequencer SHALL highlight the currently playing Step_Button in each Track during playback.

---

### Requirement 2: Kick Drum Synthesis

**User Story:** As a producer, I want a synthesised kick drum voice, so that I can create the long, deep, sub-heavy kicks characteristic of hypnotic techno.

#### Acceptance Criteria

1. THE Kick Synthesis_Engine SHALL generate audio using a sine oscillator with a pitch envelope that sweeps from a configurable start frequency to a configurable end frequency.
2. THE Kick Synthesis_Engine SHALL apply an amplitude envelope with configurable Decay (range: 100ms to 3000ms) to shape the body of the kick.
3. THE Kick Synthesis_Engine SHALL provide a Tune Parameter_Knob controlling the pitch envelope start frequency (range: 40Hz to 200Hz).
4. THE Kick Synthesis_Engine SHALL provide a Snap Parameter_Knob controlling the speed of the pitch envelope sweep (range: 1ms to 80ms).
5. THE Kick Synthesis_Engine SHALL provide a Decay Parameter_Knob controlling the amplitude envelope decay time.
6. THE Kick Synthesis_Engine SHALL provide a Level Parameter_Knob controlling the output gain of the Kick track (range: 0 to 1).
7. WHEN the Kick is triggered, THE Kick Synthesis_Engine SHALL produce a new voice instance so that retriggering does not cut off a currently playing kick.

---

### Requirement 3: Snare Drum Synthesis

**User Story:** As a producer, I want a synthesised snare drum voice, so that I can create gritty, industrial snares suited to hypnotic techno.

#### Acceptance Criteria

1. THE Snare Synthesis_Engine SHALL generate audio by mixing a pitched oscillator body with a filtered white noise component.
2. THE Snare Synthesis_Engine SHALL apply independent amplitude envelopes to the tonal body and the noise component.
3. THE Snare Synthesis_Engine SHALL provide a Tune Parameter_Knob controlling the frequency of the tonal body (range: 100Hz to 400Hz).
4. THE Snare Synthesis_Engine SHALL provide a Tone Parameter_Knob controlling the mix ratio between the tonal body and the noise component (range: 0 to 1, where 0 is full noise and 1 is full tone).
5. THE Snare Synthesis_Engine SHALL provide a Decay Parameter_Knob controlling the amplitude decay time of both components (range: 50ms to 800ms).
6. THE Snare Synthesis_Engine SHALL provide a Level Parameter_Knob controlling the output gain of the Snare track (range: 0 to 1).

---

### Requirement 4: Clap Synthesis

**User Story:** As a producer, I want a synthesised clap voice, so that I can create sharp, layered claps or snappy transients for hypnotic techno patterns.

#### Acceptance Criteria

1. THE Clap Synthesis_Engine SHALL generate audio using multiple short bursts of filtered white noise with staggered timing to simulate the layered nature of a hand clap.
2. THE Clap Synthesis_Engine SHALL apply a short amplitude envelope to each noise burst with a fast attack and configurable decay.
3. THE Clap Synthesis_Engine SHALL provide a Decay Parameter_Knob controlling the tail length of the clap (range: 20ms to 500ms).
4. THE Clap Synthesis_Engine SHALL provide a Tone Parameter_Knob controlling the centre frequency of the bandpass filter applied to the noise (range: 800Hz to 4000Hz).
5. THE Clap Synthesis_Engine SHALL provide a Level Parameter_Knob controlling the output gain of the Clap track (range: 0 to 1).

---

### Requirement 5: Hi-Hat Synthesis

**User Story:** As a producer, I want synthesised closed and open hi-hat voices, so that I can create the metallic, driving hi-hat patterns typical of hypnotic techno.

#### Acceptance Criteria

1. THE Closed_Hat Synthesis_Engine SHALL generate audio using a mix of square wave oscillators at harmonically inharmonic ratios, passed through a high-pass filter, to produce a metallic timbre.
2. THE Open_Hat Synthesis_Engine SHALL use the same metallic oscillator mix as the Closed_Hat Synthesis_Engine but with a longer, independently configurable decay.
3. THE Closed_Hat Synthesis_Engine SHALL provide a Decay Parameter_Knob controlling the amplitude decay time (range: 10ms to 200ms).
4. THE Open_Hat Synthesis_Engine SHALL provide a Decay Parameter_Knob controlling the amplitude decay time (range: 100ms to 2000ms).
5. WHEN the Open_Hat is triggered while the Open_Hat voice is already playing, THE Open_Hat Synthesis_Engine SHALL retrigger the voice, resetting the envelope.
6. THE Closed_Hat Synthesis_Engine SHALL provide a Tune Parameter_Knob controlling the high-pass filter cutoff frequency (range: 4000Hz to 12000Hz).
7. THE Open_Hat Synthesis_Engine SHALL provide a Tune Parameter_Knob controlling the high-pass filter cutoff frequency (range: 4000Hz to 12000Hz).
8. THE Closed_Hat Synthesis_Engine SHALL provide a Level Parameter_Knob (range: 0 to 1).
9. THE Open_Hat Synthesis_Engine SHALL provide a Level Parameter_Knob (range: 0 to 1).

---

### Requirement 6: Tom Synthesis

**User Story:** As a producer, I want a synthesised tom voice, so that I can add pitched percussive elements to hypnotic techno patterns.

#### Acceptance Criteria

1. THE Tom Synthesis_Engine SHALL generate audio using a sine or triangle oscillator with a pitch envelope sweep.
2. THE Tom Synthesis_Engine SHALL apply an amplitude envelope with configurable Decay to shape the body.
3. THE Tom Synthesis_Engine SHALL provide a Tune Parameter_Knob controlling the base pitch of the tom (range: 60Hz to 500Hz).
4. THE Tom Synthesis_Engine SHALL provide a Decay Parameter_Knob controlling the amplitude decay time (range: 50ms to 1500ms).
5. THE Tom Synthesis_Engine SHALL provide a Level Parameter_Knob controlling the output gain (range: 0 to 1).

---

### Requirement 7: Blip Percussion Synthesis

**User Story:** As a producer, I want a synthesised abstract percussive voice, so that I can add the unusual, hypnotic textural elements characteristic of artists like Rene Wise and Alarico.

#### Acceptance Criteria

1. THE Blip Synthesis_Engine SHALL generate audio using a short tonal burst — a sine or triangle oscillator with a very fast amplitude envelope — to produce rimshot, cowbell, or metallic blip textures.
2. THE Blip Synthesis_Engine SHALL provide a Tune Parameter_Knob controlling the oscillator frequency (range: 200Hz to 4000Hz).
3. THE Blip Synthesis_Engine SHALL provide a Decay Parameter_Knob controlling the amplitude decay time (range: 5ms to 300ms).
4. THE Blip Synthesis_Engine SHALL provide a Tone Parameter_Knob that morphs the oscillator waveform character from sine (smooth) to a more complex waveform (metallic/gritty) by mixing in a distorted or ring-modulated component.
5. THE Blip Synthesis_Engine SHALL provide a Level Parameter_Knob controlling the output gain (range: 0 to 1).

---

### Requirement 8: Step Sequencer User Interface

**User Story:** As a producer, I want a TR-8 style front-end interface, so that I can program and adjust drum patterns intuitively in the style of classic Roland drum machines.

#### Acceptance Criteria

1. THE Sequencer UI SHALL display one horizontal Track row per Instrument, each containing 16 Step_Buttons.
2. THE Sequencer UI SHALL visually group Step_Buttons into four groups of four to aid pattern reading.
3. WHEN a Step_Button is clicked, THE Sequencer UI SHALL toggle that step between active and inactive states.
4. THE Sequencer UI SHALL display active Step_Buttons in a visually distinct state from inactive Step_Buttons.
5. THE Sequencer UI SHALL display a Parameter_Knob panel per Track containing the relevant synthesis parameters for that Instrument.
6. WHEN a Parameter_Knob is adjusted, THE Sequencer UI SHALL update the corresponding Synthesis_Engine parameter in real time without requiring playback to be stopped.
7. THE Sequencer UI SHALL display Transport controls (play, stop) and a BPM input control.
8. THE Sequencer UI SHALL display a Master_Volume Parameter_Knob controlling the global output level.
9. THE Sequencer UI SHALL display a Swing control allowing the Swing offset to be adjusted from 0% to 33%.
10. THE Sequencer UI SHALL display the instrument name label for each Track.
11. WHEN the Sequencer is playing, THE Sequencer UI SHALL animate the active step indicator across the 16 Step_Buttons in each Track in sync with the audio clock.

---

### Requirement 9: Audio Output and Mixing

**User Story:** As a producer, I want all instrument tracks mixed to a single stereo output, so that I can monitor the full drum mix through my speakers or headphones.

#### Acceptance Criteria

1. THE Synthesis_Engine SHALL route all Instrument outputs through a shared master gain node before connecting to the Web_Audio_API destination.
2. THE Master_Volume Parameter_Knob SHALL control the gain of the master gain node (range: 0 to 1).
3. THE Synthesis_Engine SHALL initialise the Web_Audio_API AudioContext on the first user interaction to comply with browser autoplay policies.
4. IF the AudioContext is in a suspended state, THEN THE Synthesis_Engine SHALL resume the AudioContext before triggering any Instrument.

---

### Requirement 10: Pattern Persistence

**User Story:** As a producer, I want my patterns and parameter settings to be saved automatically, so that I do not lose my work when I refresh the browser.

#### Acceptance Criteria

1. THE Sequencer SHALL serialise the current state — all Track patterns and all Parameter_Knob values — to browser localStorage whenever any pattern step or parameter value changes.
2. WHEN the application loads, THE Sequencer SHALL deserialise and restore the previously saved state from localStorage if a saved state exists.
3. IF no saved state exists in localStorage, THEN THE Sequencer SHALL initialise all Tracks with empty patterns and default parameter values.
4. THE Sequencer SHALL serialise and deserialise state in a format such that deserialising a serialised state produces an equivalent state (round-trip property).
