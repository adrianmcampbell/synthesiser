# Hypno Drum Machine v0.1

A browser-based drum machine built for hypnotic techno. All sounds are synthesised in real time using the Web Audio API — no samples.

## Instruments

| Name    | Description |
|---------|-------------|
| Kick    | Sine oscillator with pitch envelope — deep sub-heavy kicks |
| Snare   | Sine body + highpass-filtered noise, tone controls the mix |
| Clap    | Three staggered noise bursts through a bandpass filter |
| C.Hat   | 6× inharmonic square oscillators through a highpass filter, short decay |
| O.Hat   | Same metallic mix as closed hat, longer decay, retrigger support |
| Tom     | Sine oscillator with pitch and amplitude envelope |
| Blip    | Sine through a waveshaper — rimshots, cowbells, metallic clicks |
| Blip 2  | Higher-pitched waveshaper blip variant |
| Blip 3  | FM synthesis metallic percussion — bell-like / inharmonic tones |
| Stab    | 3× detuned sawtooths + sub oscillator through resonant lowpass — thick dubby stabs |

## Features

- 32-step sequencer per instrument with lookahead scheduling
- Per-track swing (0–33%)
- Solo / Mute buttons on every track
- Pattern persistence via localStorage
- Dark industrial UI — compact single-screen layout

## Tech Stack

- TypeScript + Vite
- Web Audio API (no samples, no frameworks)
- Vitest + fast-check for property-based testing

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in a modern browser.

## Running Tests

```bash
npx vitest run
```
