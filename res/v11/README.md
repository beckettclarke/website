# v11 card artwork

Four images are all the redesign needs. Everything else on the home page is
either an existing asset or built in CSS.

Drop each file at the exact path below and it appears with no code changes —
the cards read them through a `--art` custom property and fall back to their
tint gradient until the file exists, so nothing looks broken in the meantime.

| Path | Card | Ratio | Recommended size | Notes |
|---|---|---|---|---|
| `res/v11/work/opportunity-north.png` | Opportunity North | 2:1 | 1400 × 700 | Site screenshot floating on the purple ground. |
| `res/v11/work/az-scenes.png`         | AZ Scenes         | 2:1 | 1400 × 700 | Photo / still on the orange ground. |
| `res/v11/work/team610.png`           | Team 610 Robotics | 1:1 | 1200 × 1200 | Merch + app mockup on the green ground. |
| `res/v11/projects/docket.png`        | Docket            | 1:1 | 1200 × 1200 | Phone renders on the magenta ground, anchored to the bottom. |

## Rules for the artwork

- **No baked-in text.** The card name, headline and "Coming soon" badge are all
  live HTML now, so a title inside the image will collide with them.
- **Leave the bottom ~70px clear** — that band carries a dark scrim and the label.
- Images are cropped with `object-fit: cover`, so keep the subject centred.
  Per-card framing can be nudged with `--art-pos` in `css/bento.css`.
- The card already paints a gradient underneath, so a transparent PNG that only
  carries the subject works well and keeps the tint consistent.
- Export at 2x for retina; keep each file under ~400 KB (WebP is fine too —
  just update the URL in `pages/home.html`).

## Built in CSS, no image needed

- **Imagesnap** — animated format chips (png / jpg / avif / b64) with a moving
  cursor. See `.isnap*` in `css/bento.css`.
- **Pastezone** — mini editor window with a toolbar, mono text and a blinking
  caret, plus the scrolling tagline strip.
- **Photography** — three photo rows drifting at different speeds, reusing
  `res/bento/photos/photo1–3.png`. Replace those strips to change the shots;
  they are horizontal tiles 200px tall. If you change their widths, update the
  matching `@keyframes pscroll1/2/3` distances in `css/bento.css`.
