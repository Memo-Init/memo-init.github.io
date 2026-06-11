# memo-init / memo-init.github.io

The **memo-init** documentation website — [Astro](https://astro.build) +
[Starlight](https://starlight.astro.build) + `rehype-mermaid`. Serves the spec docs, a blog and `llms.txt`.

- Landing (splash): custom Hero + Mission + CTAs (`src/components/Hero.astro`)
- Docs: hand-written + auto-synced from the `spec` repo (`scripts/sync-spec.mjs`)
- Blog: content collection under `/blog/` with RSS (`@astrojs/rss`)
- Search: Pagefind with section metadata (`scripts/inject-pagefind-meta.mjs`), verified after each build by `scripts/test-pagefind.mjs`
- `manifest.json` → `src/data/sidebar.mjs` builds the Starlight sidebar
- `/llms.txt` + `/robots.txt` served from the site (`scripts/generate-robots-txt.mjs`); `/for-llms/` explains the machine-readable layer
- Favicons generated from `src/assets/logo-square.svg` via `npm run favicons` (`scripts/generate-favicons.mjs`)
- `.github/workflows/deploy.yml` → GitHub Pages

License: MIT
