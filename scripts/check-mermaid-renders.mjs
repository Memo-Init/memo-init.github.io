// check-mermaid-renders.mjs — PRD-008 (Memo 004 Kap 5)
// Finds every .md/.mdx file with Mermaid blocks under src/content/docs/.
// Per file: counts source blocks ('^```mermaid') and searches the built HTML in
// dist/ for inline-svg renders (rehype-mermaid `inline-svg` emits
// `<svg id="mermaid-…">`, not `class="mermaid"`).
// Output: proofs/memo-init.github.io/mermaid-render-test.md
//
// Ported from flowmcp.github.io scripts/check-mermaid-renders.mjs. memo-init
// adaptations: repo-name in paths, RENDERED_MARKER matches the inline-svg id
// (the `inline-svg` strategy used in astro.config.mjs), output path.

import { readFile, readdir, writeFile, mkdir, stat } from 'node:fs/promises'
import { join, extname, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'


class MermaidRenderChecker {
    static #MERMAID_FENCE_GLOBAL = /^```mermaid\s*$/gm
    static #RENDERED_MARKER = /id="mermaid-/g
    static #ERROR_MARKER = /Syntax error in (graph|text)/g


    static async run( { contentDir, distDir, outputPath } ) {
        const files = await MermaidRenderChecker.#collectFiles( { dir: contentDir } )
        const sourceCounts = await MermaidRenderChecker.#countSourceBlocks( { files, contentDir } )
        const results = await MermaidRenderChecker.#verifyRenders( { sourceCounts, distDir } )
        await MermaidRenderChecker.#writeReport( { results, outputPath } )

        return { results }
    }


    static async #collectFiles( { dir } ) {
        const entries = await readdir( dir, { withFileTypes: true } )
        const collected = []

        await Promise.all(
            entries.map( async ( entry ) => {
                const fullPath = join( dir, entry.name )
                if( entry.isDirectory() ) {
                    const sub = await MermaidRenderChecker.#collectFiles( { dir: fullPath } )
                    sub.forEach( ( f ) => collected.push( f ) )
                } else if( [ '.md', '.mdx' ].includes( extname( entry.name ) ) ) {
                    collected.push( fullPath )
                }
            } )
        )

        return collected
    }


    static async #countSourceBlocks( { files, contentDir } ) {
        const entries = await Promise.all(
            files.map( async ( file ) => {
                const content = await readFile( file, 'utf-8' )
                const matches = content.match( MermaidRenderChecker.#MERMAID_FENCE_GLOBAL )
                const count = matches === null ? 0 : matches.length
                return { file, relPath: relative( contentDir, file ), sourceCount: count }
            } )
        )

        return entries.filter( ( e ) => e.sourceCount > 0 )
    }


    static #relPathToUrl( { relPath } ) {
        const noExt = relPath.replace( /\.(md|mdx)$/, '' )
        const parts = noExt.split( '/' )
        if( parts[ parts.length - 1 ] === 'index' ) {
            parts.pop()
        }
        const path = parts.join( '/' )
        return `/${ path }/`
    }


    static #urlToDistFile( { url, distDir } ) {
        const cleaned = url.replace( /^\/+|\/+$/g, '' )
        const candidate = cleaned === '' ? join( distDir, 'index.html' ) : join( distDir, cleaned, 'index.html' )
        return candidate
    }


    static async #verifyRenders( { sourceCounts, distDir } ) {
        const verified = await Promise.all(
            sourceCounts.map( async ( entry ) => {
                const { relPath, sourceCount } = entry
                const url = MermaidRenderChecker.#relPathToUrl( { relPath } )
                const distFile = MermaidRenderChecker.#urlToDistFile( { url, distDir } )

                const result = await MermaidRenderChecker.#readDistFile( { distFile } )
                if( !result.found ) {
                    return {
                        relPath,
                        url,
                        sourceCount,
                        renderedCount: 0,
                        errorCount: 0,
                        status: 'FAIL',
                        note: 'dist file not found'
                    }
                }

                const renderedMatches = result.content.match( MermaidRenderChecker.#RENDERED_MARKER )
                const errorMatches = result.content.match( MermaidRenderChecker.#ERROR_MARKER )
                const renderedCount = renderedMatches === null ? 0 : renderedMatches.length
                const errorCount = errorMatches === null ? 0 : errorMatches.length
                const status = ( renderedCount >= sourceCount && errorCount === 0 ) ? 'PASS' : 'FAIL'

                return { relPath, url, sourceCount, renderedCount, errorCount, status }
            } )
        )

        return verified
    }


    static async #readDistFile( { distFile } ) {
        try {
            await stat( distFile )
            const content = await readFile( distFile, 'utf-8' )
            return { found: true, content }
        } catch( error ) {
            return { found: false, content: '' }
        }
    }


    static async #writeReport( { results, outputPath } ) {
        const total = results.length
        const passed = results.filter( ( r ) => r.status === 'PASS' ).length
        const failed = total - passed
        const totalSource = results.reduce( ( sum, r ) => sum + r.sourceCount, 0 )
        const totalRendered = results.reduce( ( sum, r ) => sum + r.renderedCount, 0 )

        const header = `# Mermaid-Render-Test — memo-init.github.io\n\n` +
            `**Generated**: ${ new Date().toISOString() }\n\n` +
            `## Summary\n\n` +
            `| Metric | Value |\n` +
            `|--------|------|\n` +
            `| Pages with Mermaid | ${ total } |\n` +
            `| PASS | ${ passed } |\n` +
            `| FAIL | ${ failed } |\n` +
            `| Source blocks total | ${ totalSource } |\n` +
            `| Rendered SVGs total | ${ totalRendered } |\n` +
            `| Overall status | ${ failed === 0 ? 'PASS' : 'FAIL' } |\n\n` +
            `## Detail\n\n` +
            `| Page | URL | Source blocks | Rendered SVGs | Status |\n` +
            `|-------|-----|:--------------:|:-------------:|:-------------:|\n`

        const rows = results
            .map( ( r ) => `| ${ r.relPath } | ${ r.url } | ${ r.sourceCount } | ${ r.renderedCount } | ${ r.status } |` )
            .join( '\n' )

        const footer = `\n\n## Method\n\n` +
            `1. Count source blocks (` + '`^```mermaid`' + `) in src/content/docs/\n` +
            `2. Astro build (rehype-mermaid, inline-svg) pre-renders to <svg id="mermaid-…">\n` +
            `3. Search the built ` + '`dist/<url>/index.html`' + ` for ` + '`id="mermaid-`' + `\n` +
            `4. PASS when rendered >= source and no "Syntax error"\n`

        await mkdir( dirname( outputPath ), { recursive: true } )
        await writeFile( outputPath, header + rows + footer )
        console.log( `Report written to ${ outputPath }` )
    }
}


const __filename = fileURLToPath( import.meta.url )
const __dirname = dirname( __filename )
const repoRoot = join( __dirname, '..' )
const contentDir = join( repoRoot, 'src', 'content', 'docs' )
const distDir = join( repoRoot, 'dist' )
const outputPath = join( repoRoot, '..', '..', 'proofs', 'memo-init.github.io', 'mermaid-render-test.md' )

const { results } = await MermaidRenderChecker.run( { contentDir, distDir, outputPath } )

const failed = results.filter( ( r ) => r.status === 'FAIL' )
results.forEach( ( r ) => {
    console.log( `${ r.status }  ${ r.relPath }  (source ${ r.sourceCount } / rendered ${ r.renderedCount })` )
} )
console.log( `\n${ results.length } page(s) with Mermaid, ${ failed.length } FAIL` )
if( failed.length > 0 ) { process.exit( 1 ) }
