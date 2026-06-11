// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import { SidebarLoader } from './src/data/sidebar.mjs'

// TODO (mermaid): rehype-mermaid with the `inline-svg` strategy requires a
// headless Chromium at build time. The GitHub Pages deploy workflow installs
// Playwright Chromium (`npx playwright install --with-deps chromium`) before the
// build, so mermaid rendering is enabled in CI. It is intentionally OMITTED from
// this local config so `npm run build` stays browser-free and green on any host.
// To enable locally: install chromium, then add
//   import rehypeMermaid from 'rehype-mermaid'
//   markdown: { rehypePlugins: [ [ rehypeMermaid, { strategy: 'inline-svg', mermaidConfig: { theme: 'neutral' } } ] ] }

const sidebarData = SidebarLoader.buildSidebar()
const specVersionShort = sidebarData.specVersion.replace( /\.0$/, '' )
const specBadge = { text: `v${ specVersionShort }`, variant: 'note' }

export default defineConfig({
    site: 'https://memo-init.github.io',
    integrations: [
        starlight({
            title: 'memo-init',
            logo: {
                src: './src/assets/logo.svg',
                replacesTitle: true
            },
            favicon: '/favicon.svg',
            head: [
                { tag: 'link', attrs: { rel: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' } },
                { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '32x32', href: '/favicon-32.png' } },
                { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '192x192', href: '/favicon-192.png' } },
                { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/favicon-512.png' } }
            ],
            customCss: [
                './src/styles/theme.css'
            ],
            social: [
                { icon: 'github', label: 'GitHub', href: 'https://github.com/memo-init' }
            ],
            sidebar: [
                {
                    label: 'Specification',
                    collapsed: false,
                    badge: specBadge,
                    items: sidebarData.specItems
                },
                {
                    label: 'Workbench',
                    collapsed: true,
                    items: sidebarData.workbenchItems
                }
            ]
        })
    ]
})
