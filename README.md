<!-- TODO on publication: swap the static badges for a live deploy.yml status badge once the repo has a remote -->
![Astro](https://img.shields.io/badge/Astro-Starlight-ff5d01.svg) ![Search: Pagefind](https://img.shields.io/badge/Search-Pagefind-4051b5.svg) ![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg) ![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)

# memo-init / memo-init.github.io

The **memo-init** documentation website — built with [Astro](https://astro.build),
[Starlight](https://starlight.astro.build) and `rehype-mermaid`.

The site serves the specification docs, a blog and a machine-readable
`llms.txt`. The documentation is partly hand-written and partly auto-synced from
the `spec` repository, so the published docs stay in step with the source of
truth. Search is provided by Pagefind with per-section metadata, verified after
every build.

## Quickstart

Clone the repository, install dependencies, and start the dev server:

```bash
git clone https://github.com/memo-init/memo-init.github.io.git
cd memo-init.github.io
npm i
npm run dev
```

The dev server serves the site locally. Run `npm run build` for a production
build and `npm run preview` to preview it.

## Features

- **Landing (splash):** custom Hero + Mission + CTAs (`src/components/Hero.astro`).
- **Docs:** hand-written plus auto-synced from the `spec` repo
  (`scripts/sync-spec.mjs`).
- **Blog:** a content collection under `/blog/` with RSS (`@astrojs/rss`).
- **Search:** Pagefind with section metadata
  (`scripts/inject-pagefind-meta.mjs`), verified after each build by
  `scripts/test-pagefind.mjs`.
- **Sidebar:** `manifest.json` feeds `src/data/sidebar.mjs` to build the
  Starlight sidebar.
- **Machine-readable layer:** `/llms.txt` plus `/robots.txt`
  (`scripts/generate-robots-txt.mjs`); `/for-llms/` explains the layer.
- **Favicons:** generated from `src/assets/logo-square.svg` via
  `npm run favicons` (`scripts/generate-favicons.mjs`).
- **Deployment:** `.github/workflows/deploy.yml` publishes to GitHub Pages.

## Table of Contents

- [memo-init / memo-init.github.io](#memo-init--memo-initgithubio)
  - [Quickstart](#quickstart)
  - [Features](#features)
  - [Contributing](#contributing)
  - [License](#license)

## Contributing

Contributions are welcome! Please open an issue first to discuss what you would
like to change.

## License

[MIT](LICENSE)
