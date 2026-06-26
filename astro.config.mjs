// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import rehypeMermaid from 'rehype-mermaid'
import remarkGfm from 'remark-gfm'
import { SidebarLoader } from './src/data/sidebar.mjs'

// Mermaid (PRD-008, Memo 004 Kap 5): rehype-mermaid with the `inline-svg`
// strategy renders diagrams to bare <svg id="mermaid-…"> at build time. It needs
// a headless Chromium — the GitHub Pages deploy workflow installs Playwright
// Chromium (`npx playwright install --with-deps chromium`) before the build, and
// it is available locally too. Theme `neutral` keeps the diagrams readable on the
// light card background defined in src/styles/theme.css.

const sidebarData = SidebarLoader.buildSidebar()
const shortVersion = ( version ) => version.replace( /\.0$/, '' )
const specBadge = { text: `v${ shortVersion( sidebarData.specVersion ) }`, variant: 'note' }
const workbenchBadge = { text: `v${ shortVersion( sidebarData.workbenchVersion ) }`, variant: 'note' }
const sopBadge = { text: `v${ shortVersion( sidebarData.sopVersion ) }`, variant: 'note' }
const sessionBadge = { text: `v${ shortVersion( sidebarData.sessionVersion ) }`, variant: 'note' }

export default defineConfig({
    site: 'https://memo-init.github.io',
    markdown: {
        remarkPlugins: [
            remarkGfm
        ],
        rehypePlugins: [
            [ rehypeMermaid, { strategy: 'inline-svg', mermaidConfig: { theme: 'neutral' } } ]
        ]
    },
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
                './src/styles/theme.css',
                './src/styles/custom.css'
            ],
            components: {
                Head: './src/components/Head.astro',
                Header: './src/components/Header.astro',
                Footer: './src/components/Footer.astro',
                MobileMenuToggle: './src/components/MobileMenuToggle.astro',
                PageTitle: './src/components/PageTitleWithCopy.astro',
                Search: './src/components/SearchCustom.astro'
            },
            social: [
                { icon: 'github', label: 'GitHub', href: 'https://github.com/memo-init' }
            ],
            sidebar: [
                { label: 'About', slug: 'about' },
                {
                    label: 'Specification',
                    collapsed: false,
                    badge: specBadge,
                    items: sidebarData.specItems
                },
                {
                    label: 'Workbench',
                    collapsed: true,
                    badge: workbenchBadge,
                    items: sidebarData.workbenchItems
                },
                {
                    label: 'SOP',
                    collapsed: true,
                    badge: sopBadge,
                    items: sidebarData.sopItems
                },
                {
                    label: 'Session',
                    collapsed: true,
                    badge: sessionBadge,
                    items: sidebarData.sessionItems
                },
                { label: 'For LLMs', slug: 'for-llms' }
            ]
        })
    ]
})
