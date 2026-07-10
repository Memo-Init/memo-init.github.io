// @ts-check
import { defineConfig } from 'astro/config'
import starlight from '@astrojs/starlight'
import rehypeMermaid from 'rehype-mermaid'
import remarkGfm from 'remark-gfm'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'
import { SidebarLoader } from './src/data/sidebar.mjs'

const __dirname = dirname( fileURLToPath( import.meta.url ) )

// Memo 064 MI-T10 (F5=A): the core/memo family moved from /specification/ to /memo/. Every prior
// /specification/<slug>/ URL stays reachable via a per-slug redirect, built from the synced manifest
// (the same source sidebar.mjs reads — one slug set, no drift). Mirrors the M049 /sop/→/session/
// precedent. Degrades to none when the manifest is absent (cold checkout before sync-spec runs).
const buildMemoRedirects = () => {
    const manifestPath = resolve( __dirname, 'src', 'data', 'manifest.json' )
    if( existsSync( manifestPath ) === false ) return {}
    try {
        const manifest = JSON.parse( readFileSync( manifestPath, 'utf8' ) )
        const files = Array.isArray( manifest.files ) ? manifest.files : []
        return Object.fromEntries( files.map( ( file ) => [ `/specification/${ file.slug }/`, `/memo/${ file.slug }/` ] ) )
    } catch {
        return {}
    }
}

// Memo 064 F5a: the Meta-Spec family moved from /spec/ to /meta-spec/ (the standalone name
// "Specification" is retired). Every prior /spec/<slug>/ URL — including the internal cross-references
// still emitted in the spec payload body — stays reachable via a per-slug redirect, built from the
// synced manifest's `spec` block (same source sidebar.mjs reads). Mirrors buildMemoRedirects.
const buildMetaSpecRedirects = () => {
    const manifestPath = resolve( __dirname, 'src', 'data', 'manifest.json' )
    if( existsSync( manifestPath ) === false ) return {}
    try {
        const manifest = JSON.parse( readFileSync( manifestPath, 'utf8' ) )
        const files = Array.isArray( manifest.spec?.files ) ? manifest.spec.files : []
        return Object.fromEntries( files.map( ( file ) => [ `/spec/${ file.slug }/`, `/meta-spec/${ file.slug }/` ] ) )
    } catch {
        return {}
    }
}

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
const sessionBadge = { text: `v${ shortVersion( sidebarData.sessionVersion ) }`, variant: 'note' }
const specMetaBadge = { text: `v${ shortVersion( sidebarData.specMetaVersion ) }`, variant: 'note' }

export default defineConfig({
    site: 'https://memo-init.github.io',
    // Memo 049: the SOP family was folded into the Session family. The former /sop/… URLs
    // keep resolving via these redirects (the SOP overview slug becomes /session/sop/).
    redirects: {
        '/sop/overview/': '/session/sop/',
        '/sop/common-denominator/': '/session/common-denominator/',
        '/sop/instances/': '/session/instances/',
        '/sop/conventions/': '/session/conventions/',
        // Memo 064 MI-T10: /specification/<slug>/ → /memo/<slug>/ (URL stability for the moved core family).
        ...buildMemoRedirects(),
        // Memo 064 F5a: /spec/<slug>/ → /meta-spec/<slug>/ (URL stability for the renamed Meta-Spec family).
        ...buildMetaSpecRedirects()
    },
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
                { tag: 'link', attrs: { rel: 'icon', type: 'image/png', sizes: '512x512', href: '/favicon-512.png' } },
                // Bug 9 fix: twitter:card=summary_large_image is emitted by Starlight,
                // but no og:image existed -> blank social cards. Provide a default.
                { tag: 'meta', attrs: { property: 'og:image', content: 'https://memo-init.github.io/og-default.png' } },
                { tag: 'meta', attrs: { name: 'twitter:image', content: 'https://memo-init.github.io/og-default.png' } },
                // Bug 10 fix: RSS feed autodiscovery (feed readers / browser extensions).
                { tag: 'link', attrs: { rel: 'alternate', type: 'application/rss+xml', title: 'memo-init Blog', href: '/blog/rss.xml' } }
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
                    label: 'Memo',
                    collapsed: true,
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
                    label: 'Session',
                    collapsed: true,
                    badge: sessionBadge,
                    items: sidebarData.sessionItems
                },
                {
                    label: 'Meta-Spec',
                    collapsed: true,
                    badge: specMetaBadge,
                    items: sidebarData.specMetaItems
                },
                { label: 'For LLMs', slug: 'for-llms' }
            ]
        })
    ]
})
