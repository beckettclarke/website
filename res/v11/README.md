# v11 assets

Sourced from `v11-temp/` and renamed:

| Original | Now | Used by |
|---|---|---|
| `610-pile.png`         | `res/v11/work/610-pile.png`        | Team 610 card artwork |
| `ON-website.png`       | `res/v11/work/on-site.png`         | Opportunity North card artwork |
| `AZscenes-outline.png` | `res/v11/work/az-mark.png`         | AZ Scenes watermark |
| `Docket-ss1/2/3.png`   | `res/v11/projects/docket-1/2/3.png`| Docket phone fan |
| `imagesnap-image.png`  | `res/v11/imagesnap/thumb.png`      | Imagesnap source file |
| `imagesnap-cursor.png` | `res/v11/imagesnap/cursor.png`     | Imagesnap cursor |
| `610logo.png`          | `icons/v11/610.png`                | Card label icon |
| `ON-logo.png`          | `icons/v11/on.png`                 | Card label icon |
| `AZscenes-outline.png` | `icons/v11/az.png`                 | Card label icon |
| `Docketlogo.svg`       | `icons/v11/docket.svg`             | Card label icon |
| `imagesnaplogo.svg`    | `icons/v11/imagesnap.svg`          | Card label icon |

Placement is tuned per card in `css/bento.css` (`.shot-610`, `.shot-on`,
`.azmark`, `.docket-shots`, `.isnap-*`). Swapping an image for one with a
different crop usually just means nudging those offsets.

## Photography card

Pulls 16 existing `-preview.webp` files straight from `/cdn` — listed in
`pages/home.html`. They load only once the card comes within 400px of the
viewport, then each column is duplicated in JS so the vertical scroll loops
seamlessly. To change the shots, edit the `data-src` list; keep 4 per column.
