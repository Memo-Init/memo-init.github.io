# memo-init / memo-init.github.io

The **memo-init** documentation website — [Astro](https://astro.build) +
[Starlight](https://starlight.astro.build) + `rehype-mermaid`. Serves the spec docs and `llms.txt`.

- Landing (splash): Hero + Mission + Stats + CTAs
- Docs: hand-written + auto-synced from the `spec` repo (`scripts/sync-spec.mjs`)
- `manifest.json` → `src/data/sidebar.mjs` builds the Starlight sidebar
- `/llms.txt` served from the site; `.github/workflows/deploy.yml` → GitHub Pages

License: MIT
