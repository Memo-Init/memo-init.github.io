// Pagefind meta injector — Fix 1 (build half) of the 5 FlowMCP pagefind fixes
// (memo 003, chapter 8). Template: flowmcp.github.io scripts/inject-pagefind-meta.mjs.
// memo-init adaptation: the sidebar is built dynamically by SidebarLoader from
// src/data/manifest.json, so the slug-to-section mapping is read from
// SidebarLoader.buildSidebar() instead of text-parsing astro.config.mjs
// (the config only references dynamic items — text parsing would find zero slugs).
// Writes a hidden span[data-pagefind-meta="section"] at the start of the body
// content of every mapped MD/MDX docs page. Idempotent — existing marker blocks
// are replaced. Runs in the build chain after sync-spec, before astro build.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join, relative } from 'node:path'
import { SidebarLoader } from '../src/data/sidebar.mjs'


const __dirname = dirname( fileURLToPath( import.meta.url ) )
const ROOT = join( __dirname, '..' )
const DOCS_DIR = join( ROOT, 'src', 'content', 'docs' )
const MARKER_START_MD = '<!-- PAGEFIND-META-START -->'
const MARKER_END_MD = '<!-- PAGEFIND-META-END -->'
const MARKER_START_MDX = '{/* PAGEFIND-META-START */}'
const MARKER_END_MDX = '{/* PAGEFIND-META-END */}'


const buildSidebarMapping = () => {
    const { specItems, workbenchItems, sopItems } = SidebarLoader.buildSidebar()
    const mapping = {}

    const walkItems = ( { items, parents } ) => {
        items.forEach( ( item ) => {
            if( typeof item.slug === 'string' ) {
                mapping[ item.slug ] = parents.join( ' > ' )
            }
            if( Array.isArray( item.items ) ) {
                const label = typeof item.label === 'string' ? item.label : ''
                const nextParents = label === '' ? parents : parents.concat( [ label ] )
                walkItems( { items: item.items, parents: nextParents } )
            }
        } )
    }

    walkItems( { items: specItems, parents: [ 'Specification' ] } )
    walkItems( { items: workbenchItems, parents: [ 'Workbench' ] } )
    walkItems( { items: sopItems && Array.isArray( sopItems ) ? sopItems : [], parents: [ 'SOP' ] } )

    return mapping
}


const walkMdx = ( { dir, acc } ) => {
    const entries = readdirSync( dir )
    entries.forEach( ( entry ) => {
        const full = join( dir, entry )
        const stats = statSync( full )
        if( stats.isDirectory() ) {
            walkMdx( { dir: full, acc } )
        } else if( entry.endsWith( '.mdx' ) || entry.endsWith( '.md' ) ) {
            acc.push( full )
        }
    } )
    return acc
}


const escapeForRegex = ( s ) => s.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' )


const injectMeta = ( { file, section } ) => {
    const raw = readFileSync( file, 'utf8' )
    const match = raw.match( /^---\n([\s\S]*?)\n---\n([\s\S]*)$/ )
    if( !match ) { return { status: false, reason: 'no-frontmatter' } }

    const isMdx = file.endsWith( '.mdx' )
    const markerStart = isMdx ? MARKER_START_MDX : MARKER_START_MD
    const markerEnd = isMdx ? MARKER_END_MDX : MARKER_END_MD

    const [ , frontmatter, body ] = match
    // strip any previously injected meta block (both formats, for safety)
    let cleanBody = body
    const stripPatterns = [
        new RegExp( `${escapeForRegex( MARKER_START_MD )}[\\s\\S]*?${escapeForRegex( MARKER_END_MD )}\\n*`, 'g' ),
        new RegExp( `${escapeForRegex( MARKER_START_MDX )}[\\s\\S]*?${escapeForRegex( MARKER_END_MDX )}\\n*`, 'g' )
    ]
    stripPatterns.forEach( ( re ) => { cleanBody = cleanBody.replace( re, '' ) } )

    const metaBlock = `${markerStart}\n<span style="display:none" data-pagefind-meta="section">${section}</span>\n${markerEnd}\n\n`
    writeFileSync( file, `---\n${frontmatter}\n---\n${metaBlock}${cleanBody}` )
    return { status: true }
}


const cleanupExistingFrontmatterPagefind = ( file ) => {
    // Remove any leftover `pagefind:\n  customMeta: ...` frontmatter blocks from
    // earlier injection attempts (avoid schema collisions).
    const raw = readFileSync( file, 'utf8' )
    const match = raw.match( /^---\n([\s\S]*?)\n---\n([\s\S]*)$/ )
    if( !match ) { return false }
    const [ , frontmatter, body ] = match
    if( !/^pagefind:\s*\n\s+customMeta:/m.test( frontmatter ) ) { return false }
    const cleaned = frontmatter.replace( /\npagefind:\s*\n\s+customMeta:[\s\S]*?(?=\n[a-zA-Z_]|$)/, '' )
    writeFileSync( file, `---\n${cleaned}\n---\n${body}` )
    return true
}


const run = () => {
    const mapping = buildSidebarMapping()
    const files = walkMdx( { dir: DOCS_DIR, acc: [] } )

    let injected = 0
    let noMapping = 0
    let skipped = 0
    let cleaned = 0

    files.forEach( ( file ) => {
        if( cleanupExistingFrontmatterPagefind( file ) ) { cleaned += 1 }

        const rel = relative( DOCS_DIR, file )
        const noLocale = rel.replace( /^de[\\/]/, '' )
        const slug = noLocale.replace( /\.(mdx|md)$/, '' ).replace( /\\/g, '/' )
        const section = mapping[ slug ]
        if( section === undefined ) { noMapping += 1; return }
        const res = injectMeta( { file, section } )
        if( res.status ) { injected += 1 } else { skipped += 1 }
    } )

    console.log( 'Pagefind meta injection:', { injected, noMapping, skipped, cleaned, totalFiles: files.length, mappingKeys: Object.keys( mapping ).length } )
    return { status: true }
}


run()
