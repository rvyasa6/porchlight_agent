# Porchlight Agent

An ADHD-friendly companion that keeps focus gentle: pick your energy level, run a
20-minute sprint with a live timer, collect tiny wins, check in with yourself, and
chat with a small on-device coach. Installable as a PWA on iPhone, Android, and desktop.

**Not medical advice.** For emergencies, contact local services or a trusted person.

## Features

- **Energy-aware sprints** — Low / Medium / High energy reshapes the guidance and the goal size.
- **Focus timer** — 10/20/30/45-minute presets, start / pause / reset, progress bar, completion state.
- **Tiny wins** — checkable micro-tasks (drink water, one plate in the sink, ...), saved on-device.
- **Check-ins** — 1–5 energy rating with an optional note, counted per day, stored locally.
- **Companion chat** — rule-based, fully client-side. Try "Help me sprint for 30 minutes".
- **Dopamine button** — a small encouragement exactly when you need one.
- **PWA** — manifest, maskable icons, and a service worker (offline support, add to home screen).

No backend, no accounts, no tracking. Everything stays in the browser.

## Run it

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Deploy (free)

1. Push to GitHub.
2. Import the repo at [vercel.com](https://vercel.com) (or Cloudflare Pages). Defaults work, no config needed.
3. Open the live URL on your phone → Share → Add to Home Screen.

## Tech

Next.js 15 (App Router) · React 19 · Tailwind CSS 4 · TypeScript. Zero runtime dependencies beyond React/Next.

## License

MIT — see [LICENSE](LICENSE).
