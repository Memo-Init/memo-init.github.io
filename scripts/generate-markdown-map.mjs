// generate-markdown-map.mjs — PRD-010 (Memo 004 Kap 8)
// Reads every .md / .mdx page under src/content/docs/, strips YAML frontmatter,
// and writes the bare markdown body to public/markdown-sources/{slug}.md
// (one file per page). HeaderCopyButton.astro fetches these files at click time
// to copy the page markdown into the user's clipboard.
//
// Ported from flowmcp.github.io scripts/generate-markdown-map.mjs. memo-init is
// EN-only, so the DE slug-prefix handling is dropped (it was a no-op here anyway,
// the walk is locale-agnostic).
//
// Conventions:
//   - index.md/.mdx files are written as {dir}/index.md (preserved by slug)
//   - Hidden Starlight files prefixed with `_` are skipped

import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'


const __dirname = dirname( fileURLToPath( import.meta.url ) )
const REPO_ROOT = join( __dirname, '..' )
const DOCS_DIR = join( REPO_ROOT, 'src', 'content', 'docs' )
const OUT_DIR = join( REPO_ROOT, 'public', 'markdown-sources' )

const FRONTMATTER_REGEX = /^---\n[\s\S]*?\n---\n?/


const walkDir = async ( { dir, acc } ) => {
    const entries = await readdir( dir, { withFileTypes: true } )
    const tasks = entries.map( async ( entry ) => {
        const full = join( dir, entry.name )
        if( entry.isDirectory() ) {
            await walkDir( { dir: full, acc } )
            return
        }
        if( !entry.isFile() ) { return }
        if( !( entry.name.endsWith( '.md' ) || entry.name.endsWith( '.mdx' ) ) ) { return }
        if( entry.name.startsWith( '_' ) ) { return }
        acc.push( full )
    } )
    await Promise.all( tasks )
    return acc
}


const stripFrontmatter = ( { raw } ) => {
    const match = raw.match( FRONTMATTER_REGEX )
    if( match === null ) { return { body: raw.trim() } }
    return { body: raw.slice( match[ 0 ].length ).trim() }
}


const deriveSlug = ( { file } ) => {
    const rel = relative( DOCS_DIR, file ).split( sep ).join( '/' )
    const noExt = rel.replace( /\.(md|mdx)$/, '' )
    return { slug: noExt }
}


const ensureDir = async ( { filePath } ) => {
    await mkdir( dirname( filePath ), { recursive: true } )
}


const writeOne = async ( { file } ) => {
    const raw = await readFile( file, 'utf8' )
    const { body } = stripFrontmatter( { raw } )
    const { slug } = deriveSlug( { file } )
    const outPath = join( OUT_DIR, `${ slug }.md` )
    await ensureDir( { filePath: outPath } )
    await writeFile( outPath, body, 'utf8' )
    return { slug }
}


const run = async () => {
    await mkdir( OUT_DIR, { recursive: true } )
    const files = await walkDir( { dir: DOCS_DIR, acc: [] } )
    const results = await Promise.all( files.map( ( file ) => writeOne( { file } ) ) )
    const slugs = results.map( ( r ) => r.slug ).sort()
    console.log( `generate-markdown-map: wrote ${ slugs.length } files to public/markdown-sources/` )
    slugs.slice( 0, 8 ).forEach( ( slug ) => {
        console.log( `  - ${ slug }.md` )
    } )
    if( slugs.length > 8 ) {
        console.log( `  ... and ${ slugs.length - 8 } more` )
    }
}


run().catch( ( err ) => {
    console.error( '[generate-markdown-map] failed:', err )
    process.exit( 1 )
} )
