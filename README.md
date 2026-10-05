# Lab-to-Market Readiness Scorer

A single-page, no-build web tool that scores a lab-born technology on **Technology Readiness (TRL 1-9, NASA/DOE)**, **Manufacturing Readiness (MRL 1-10, DoD)** and a short **business readiness** checklist. It names the biggest gap, recommends 3-5 sector-specific next milestones and writes a pitch-ready summary. Built for deep-tech venture studio staff, investors and founders spinning technology out of national labs and universities (energy, advanced materials, advanced manufacturing, quantum).

> Scores are a self-assessment aid, not an official certification.

![Screenshot placeholder](docs/screenshot.png)
<!-- Replace docs/screenshot.png with a capture of the results screen. -->

## Features

- Step-by-step questionnaire with progress bar, Back/Next and inline validation
- Gated scoring: a level counts only when every lower level is confirmed
- Results with stepped-bar gauges, official level definitions, biggest-gap callout, milestones, summary
- Copy summary, Print / Save as PDF (print stylesheet), Start over
- Progress saved to `localStorage` (works fine if storage is blocked)
- Light/dark mode, responsive from 375px, keyboard accessible

## Project layout

| File | Purpose |
| --- | --- |
| `index.html`, `styles.css`, `app.js` | UI, styling and rendering |
| `data/questions.js` | All questions, level definitions, milestone text and summary templates |
| `scoring.js` | Pure scoring functions (`scoreTRL`, `scoreMRL`, `pickMilestones`, `findBiggestGap`, `buildSummary`) |
| `tests/scoring.test.js` | Unit tests (Node built-in runner) |

To change wording or add a sector, edit `data/questions.js` only.

## Run locally

```bash
python3 -m http.server 8000
# open http://localhost:8000
```

## Run tests

Requires Node 18+; no dependencies.

```bash
node --test
```

## Deploy on GitHub Pages

1. Push this repo to GitHub.
2. Go to **Settings > Pages**.
3. Under **Build and deployment**, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
4. Your site appears at `https://<username>.github.io/Technology-Readiness-Calculator/`.

All asset paths are relative and an empty `.nojekyll` file is included.

## Before you publish

- Replace the `https://your-portfolio.example` link in the `index.html` footer.
- Optional: add an `og:image` (absolute URL) and `og:url` once you know the hosted address.
