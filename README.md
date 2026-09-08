# A Letter For Her — customization guide

A single-experience birthday site: Welcome → Compliment → Stage → Set the
Mood (music + balloons) → The Letter (wax-seal reveal) → Our Memories →
Final moment. No frameworks, no build step — just open `index.html`.

## What to replace before sending it

| What | Where | How |
|---|---|---|
| Her name / headline | `index.html`, search `data-editable="recipient-heading"` | Edit the text directly |
| The love letter | `index.html`, inside `<div id="letterBody">` | Each `<p>` is one line that fades in on its own — add/remove `<p>` tags freely |
| Signature line | `data-editable="letter-signoff"` | Edit the text |
| Photo captions | search `data-editable="caption-1"` through `caption-5` | Edit the text |
| Final screen lines | `data-editable="final-line-one"` / `final-line-two` | Edit the text |
| Song | `assets/audio/our-song.mp3` | Drop in any MP3 with that exact filename |
| Photos | `assets/images/image1.svg` … `image5.svg` | These are placeholders. Add real photos as `.jpg`/`.png` into `assets/images/`, then update the five `src="..."` attributes in the "Our Memories" section of `index.html` to match your filenames |
| Colors | `style.css`, the `:root { ... }` block at the top | Every color used across the whole site is a variable there |

## Hosting it

This is plain HTML/CSS/JS, so any static host works — the easiest options:
- **Netlify Drop** (netlify.com/drop) — drag the whole folder in, get a link instantly.
- **GitHub Pages** — push the folder to a repo and enable Pages.
- Or just zip the folder and open `index.html` locally; everything (including the audio) works offline too.

## Notes on behavior

- The story can't be skipped ahead — each chapter only unlocks by clicking through, by design.
- Music only starts after she taps "Play Our Song" (browser autoplay rules require this) and then keeps looping through every later chapter.
- If she skips "Let the Colors Fly," balloons start automatically the moment the letter reveal begins.
- Everything respects `prefers-reduced-motion` for accessibility.
