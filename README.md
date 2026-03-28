# Hypno

A browser-based drum synthesiser built for hypnotic techno. All sounds are generated in real time using the Web Audio API — no samples.

## Instruments

| Name       | Description |
|------------|-------------|
| Kick       | Sine oscillator with pitch envelope sweep — deep sub-heavy kicks |
| Snare      | Sine body + highpass-filtered noise, tone controls the mix |
| Clap       | Three staggered noise bursts through a bandpass filter |
| C.Hat      | 6× inharmonic square oscillators through a highpass filter, short decay |
| O.Hat      | Same metallic mix as closed hat, longer decay, retrigger support |
| Tom        | Sine oscillator with pitch and amplitude envelope |
| Blip       | Sine through a waveshaper — rimshots, cowbells, metallic clicks |
| Acid       | Sawtooth through a resonant lowpass filter with envelope sweep — 303-style basslines |

## Features

- **16-step sequencer** per instrument with lookahead scheduling via `AudioContext.currentTime`
- **Per-track swing** — each track has its own swing offset (0–33%)
- **Solo / Mute** — S and M buttons on every track
- **Per-track FX** — reverb mix, delay mix, delay time, distortion per instrument
- **Master FX** — same effects applied to the full mix
- **Pattern persistence** — state auto-saves to `localStorage` on every change
- **Dark industrial UI** — amber `#f5a623` active steps, white playhead highlight

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

## Controls

- **▶ / ■** — play / stop
- **BPM slider** — 60 to 200 BPM
- **Step buttons** — click to toggle a step on/off
- **Knobs** — drag up to increase, drag down to decrease
- **S** — solo a track (all others muted)
- **M** — mute a track
