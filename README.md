<a href="https://beckettclarke.ca">
  <img src=".github/readme/hero.png" alt="Hi, I'm Beckett. I design brands, build websites and apps, and photograph things I see." width="100%">
</a>

<p align="center">
  <a href="https://beckettclarke.ca"><img src="https://img.shields.io/badge/beckettclarke.ca-visit-ff9a1f?style=for-the-badge&labelColor=0d0c0b" alt="Visit beckettclarke.ca"></a>
  <a href="https://github.com/beckettclarke/website/actions/workflows/static.yml"><img src="https://img.shields.io/github/actions/workflow/status/beckettclarke/website/static.yml?branch=main&style=for-the-badge&label=deploy&labelColor=0d0c0b&color=6fd08c" alt="Deploy status"></a>
  <img src="https://img.shields.io/badge/version-12-f2ede6?style=for-the-badge&labelColor=0d0c0b" alt="Version 12">
  <img src="https://img.shields.io/badge/framework-none-f2ede6?style=for-the-badge&labelColor=0d0c0b" alt="No framework">
</p>

<p align="center">
  The source for <a href="https://beckettclarke.ca"><b>beckettclarke.ca</b></a>, my portfolio for design, code and photography.<br>
  Hand-written HTML, CSS and JavaScript. No framework, no bundler, no <code>node_modules</code>.
</p>

<br>

<img src=".github/readme/sec-work.png" alt="01 / Work" width="100%">

<a href="https://beckettclarke.ca/#work">
  <img src=".github/readme/work.png" alt="Team 610 Robotics, Opportunity North, Crescent School, Crescent Outreach and Apollo Zhang" width="100%">
</a>

| | Project | What I made |
|:-:|---|---|
| <img src="icons/team610.png" width="36"> | [**Team 610 Robotics**](https://beckettclarke.ca/clients/team610/) | The 25th anniversary yearbook, the sponsorship package sent to partners, merch, a scouting app design used on competition days, and a new website. |
| <img src="icons/opportunitynorth.png" width="36"> | [**Opportunity North**](https://beckettclarke.ca/clients/opportunitynorth/) | Logo, brand and website for a platform that connects volunteers with people who need a hand. |
| <img src="icons/crescent.png" width="36"> | [**Crescent School**](https://beckettclarke.ca/clients/crescent/) | Posters and graphics for Friday Night Lights and House Day. |
| <img src="icons/csoutreach.png" width="36"> | [**Crescent Outreach**](https://beckettclarke.ca/clients/csoutreach/) | Logo. |
| <img src="icons/apollozhang.png" width="36"> | [**Apollo Zhang**](https://beckettclarke.ca/clients/apollozhang/) | Logo for Apollo Zhang & AZ Scenes. |

<br>

<img src=".github/readme/sec-apps.png" alt="02 / Apps" width="100%">

<a href="https://beckettclarke.ca/#apps">
  <img src=".github/readme/apps.png" alt="Docket, coming soon to the App Store, and TuffLyrics, live" width="100%">
</a>

| | App | | |
|:-:|---|---|:-:|
| <img src="icons/docket.png" width="36"> | **Docket** | Every receipt, organized. An iPhone app for receipts. | `Coming soon` |
| <img src="icons/tufflyrics.png" width="36"> | [**TuffLyrics**](https://tufflyrics.beckettclarke.ca) | Real-time, word-by-word synced lyrics for Spotify. | `Web` |
| <img src="icons/pastezonefull.png" width="36"> | [**Pastezone**](https://pastezone.beckettclarke.ca) | A scratchpad for text, with Markdown and export. | `Web` |
| <img src="icons/imagesnapfull.png" width="36"> | [**Imagesnap**](https://beckettclarke.github.io/imagesnap) | Convert images between PNG, JPG, ICO, WEBP and GIF in the browser. | `Web` |
| <img src="icons/socials/macosicons.png" width="36"> | [**macOS Icons**](https://beckettclarke.ca/macicons/) | 36 custom app icons for macOS, free to download. | `Free` |

<br>

<img src=".github/readme/sec-photos.png" alt="03 / Photos" width="100%">

<a href="https://beckettclarke.ca/photography">
  <img src=".github/readme/photos.png" alt="A wall of photographs: airshows, drone shots, landscapes, and a very good dog" width="100%">
</a>

<p align="center">
  <a href="https://beckettclarke.ca/photography/cias/2025/"><b>CIAS 2025</b></a> &nbsp;·&nbsp;
  <a href="https://beckettclarke.ca/clients/northmount/"><b>Northmount School</b></a> &nbsp;·&nbsp;
  <a href="https://beckettclarke.ca/photography/strathcona/"><b>Strathcona</b></a> &nbsp;·&nbsp;
  <a href="https://beckettclarke.ca/photography/drone/"><b>Drone</b></a>
</p>

<p align="center">
  Full-resolution images live on a separate CDN, so this repo stays light.<br>
  Every photo opens in a keyboard- and swipe-friendly lightbox.
</p>

<br>

<img src=".github/readme/sec-hood.png" alt="04 / How it works" width="100%">

<img src=".github/readme/flow.png" alt="How a page loads: 404.html redirect, index.html shell, router.js fetches a page fragment, initPage wires it up" width="100%">

The whole site is a single `index.html` shell. Every page is an HTML **fragment** in `pages/` that `router.js` drops into `<content>`, so moving between pages never does a full reload. GitHub Pages doesn't know about routes like `/clients/team610/`, so `404.html` turns the path into a hash, and the router swaps it straight back to a clean URL with `history.replaceState`.

```text
website/
├── index.html            ← the shell: header, footer, lightbox, toast
├── 404.html              ← turns /any/path into /#/any/path for the router
├── router.js             ← path → pages/<route>.html, transitions, scroll restore
├── scripts.js            ← nav, reveals, filmstrip, chips, lightbox, macOS icon picker
├── flexkit.js / .css     ← tiny helpers: get.id(), log(), attribute layout utilities
├── header.html           ← nav, loaded into <header>
├── footer.html           ← footer, loaded into <footer>
├── pages/                ← one fragment per route
│   ├── home.html
│   ├── clients_team610.html          → /clients/team610/
│   ├── photography_cias_2025.html    → /photography/cias/2025/
│   └── …
├── fragments.js          ← generated bundle of every fragment (for file://)
├── build-fragments.py    ← regenerates fragments.js
├── css/                  ← global, header, home and page styles
├── icons/  res/          ← logos, app icons, bento art, previews
└── .github/workflows/    ← deploys to GitHub Pages on push to main
```

<details>
<summary><b>A few details worth knowing</b></summary>
<br>

- **Routes map to files.** Slashes become underscores, so `/clients/team610/yearbook` loads `pages/clients_team610_yearbook.html`. Anything missing falls back to `pages/notfound.html`.
- **Works straight from disk.** Browsers block `fetch()` on `file://`, so the router falls back to `window.BC_FRAGMENTS` from `fragments.js` and uses hash routing locally.
- **Back and forward remember where you were.** Scroll position is saved in `history.state` and restored on `popstate`.
- **Links like `/#work`** go home first, then scroll to the section once it's loaded.
- **Cloudflare-safe emails.** Cloudflare's email obfuscation doesn't run inside injected HTML, so `scripts.js` decodes those links itself.
- **Respects reduced motion.** Animations, reveals and the film grain calm down under `prefers-reduced-motion`.
- **Cache busting.** CSS and JS are loaded with `?v=12.0.2`. Bump it in `index.html` when shipping changes.
- **Design tokens.** Warm ink `#0d0c0b`, paper `#f2ede6` and one ember accent `#ff9a1f`, set in Satoshi and IBM Plex Mono.

</details>

<br>

<img src=".github/readme/sec-run.png" alt="05 / Local dev" width="100%">

Serve the folder with anything that serves static files:

```bash
git clone https://github.com/beckettclarke/website.git
cd website
python3 -m http.server 8765
# → http://localhost:8765
```

Or just open `index.html` in a browser. It switches to hash routing and reads pages from `fragments.js`.

**Adding a page**

1. Create `pages/<route>.html` with a `<main class="page" data-title="Page title">` root. For `/photos/new/`, that's `pages/photos_new.html`.
2. Link to it with a normal `<a href="/photos/new/">`. The router intercepts the click.
3. Rebuild the offline bundle so it also works from `file://`:

   ```bash
   python3 build-fragments.py
   ```

**Deploying**

Pushing to `main` runs [`.github/workflows/static.yml`](.github/workflows/static.yml), which uploads the repo as-is to GitHub Pages. There's no build step.

<br>

<a href="mailto:hi@beckettclarke.ca">
  <img src=".github/readme/footer.png" alt="Got something in mind? Say hi at hi@beckettclarke.ca" width="100%">
</a>

<p align="center">
  <a href="mailto:hi@beckettclarke.ca"><img src="icons/socials/email.png" width="28" alt="Email"></a>&nbsp;&nbsp;
  <a href="https://instagram.com/beckett_clarke"><img src="icons/socials/instagram.png" width="28" alt="Instagram"></a>&nbsp;&nbsp;
  <a href="https://github.com/beckettclarke"><img src="icons/socials/github.png" width="28" alt="GitHub"></a>&nbsp;&nbsp;
  <a href="https://youtube.com/@beckettclarke"><img src="icons/socials/youtube.png" width="28" alt="YouTube"></a>&nbsp;&nbsp;
  <a href="https://codepen.io/beckettclarke"><img src="icons/socials/codepen.png" width="28" alt="CodePen"></a>
</p>

<p align="center"><sub>© 2026 Beckett Clarke · Made in 🇨🇦 with vanilla HTML</sub></p>
