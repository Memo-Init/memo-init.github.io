// Pagefind section-mapping test — Fix 5 of the 5 FlowMCP pagefind fixes
// (memo 003 phase 4, PRD-008). Template: flowmcp.github.io scripts/test-pagefind.mjs.
// Reads the built pagefind fragments (gzipped JSON in dist/pagefind/fragment/)
// and checks per test query that at least one hit carries a section meta.
// Output: proofs/memo-init.github.io/pagefind-test-003.md (project level)

import { readFile, readdir, writeFile, mkdir } from 'node:fs/promises'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { gunzipSync } from 'node:zlib'


class PagefindTester {
    static #QUERIES = [
        'memo',
        'workbench',
        'rollout',
        'pipeline',
        'specification'
    ]

    static #LANG_PREFIX = 'en_'


    static async run( { fragmentDir, outputPath } ) {
        const fragments = await PagefindTester.#loadFragments( { fragmentDir } )
        const results = PagefindTester.#runQueries( { fragments, queries: PagefindTester.#QUERIES } )
        await PagefindTester.#writeReport( { results, fragmentCount: fragments.length, outputPath } )

        return { results }
    }


    static async #loadFragments( { fragmentDir } ) {
        const entries = await readdir( fragmentDir )
        const enFragments = entries.filter( ( name ) => name.startsWith( PagefindTester.#LANG_PREFIX ) && name.endsWith( '.pf_fragment' ) )

        const parsed = await Promise.all(
            enFragments.map( async ( name ) => {
                const buf = await readFile( join( fragmentDir, name ) )
                const text = gunzipSync( buf ).toString( 'utf-8' )
                const jsonStart = text.indexOf( '{' )
                if( jsonStart < 0 ) { return null }
                try {
                    const obj = JSON.parse( text.slice( jsonStart ) )
                    return obj
                } catch( error ) {
                    return null
                }
            } )
        )

        return parsed.filter( ( f ) => f !== null )
    }


    static #runQueries( { fragments, queries } ) {
        return queries
            .map( ( query ) => {
                const lower = query.toLowerCase()
                const hits = fragments
                    .filter( ( frag ) => {
                        const content = ( frag.content || '' ).toLowerCase()
                        const title = ( frag.meta?.title || '' ).toLowerCase()
                        const url = ( frag.url || '' ).toLowerCase()
                        return content.includes( lower ) || title.includes( lower ) || url.includes( lower )
                    } )
                    .map( ( frag ) => ( {
                        url: frag.url || '',
                        title: frag.meta?.title || '',
                        section: frag.meta?.section || ''
                    } ) )

                const withSection = hits.filter( ( h ) => h.section !== '' )
                const sectionRate = hits.length === 0 ? 0 : ( ( withSection.length / hits.length ) * 100 ).toFixed( 1 )
                const sections = [ ...new Set( withSection.map( ( h ) => h.section ) ) ]

                return {
                    query,
                    hitCount: hits.length,
                    withSection: withSection.length,
                    sectionRate,
                    sections,
                    samples: hits.slice( 0, 5 )
                }
            } )
    }


    static async #writeReport( { results, fragmentCount, outputPath } ) {
        const allHaveSection = results.every( ( r ) => r.hitCount > 0 && r.withSection > 0 )

        const header = `# Pagefind-Test Memo 003 Phase 4 (PRD-008) — Ergebnisse\n\n` +
            `**Generated**: ${ new Date().toISOString() }\n\n` +
            `## Zusammenfassung\n\n` +
            `| Metrik | Wert |\n` +
            `|--------|------|\n` +
            `| Fragmente indiziert (en) | ${ fragmentCount } |\n` +
            `| Queries getestet | ${ results.length } |\n` +
            `| Status | ${ allHaveSection ? 'PASS' : 'FAIL' } |\n\n` +
            `## Test-Queries\n\n` +
            `| Query | Treffer | Mit Section-Label | Section-Rate | Sections |\n` +
            `|-------|:-------:|:-----------------:|:------------:|----------|\n`

        const rows = results
            .map( ( r ) => `| \`${ r.query }\` | ${ r.hitCount } | ${ r.withSection } | ${ r.sectionRate }% | ${ r.sections.join( ', ' ) || '—' } |` )
            .join( '\n' )

        const details = results
            .map( ( r ) => {
                const sampleLines = r.samples
                    .map( ( s ) => `- ${ s.url } (Section: **${ s.section || '—' }**, Title: ${ s.title })` )
                    .join( '\n' )
                return `### Query: \`${ r.query }\`\n\n${ sampleLines || '_Keine Treffer_' }\n`
            } )
            .join( '\n' )

        const footer = `\n## Methode\n\n` +
            `1. ` + '`npm run build`' + ` erzeugt Pagefind-Index in ` + '`dist/pagefind/`' + `\n` +
            `2. Skript lese alle ` + '`en_*.pf_fragment`' + ` Files (gzipped JSON)\n` +
            `3. Pro Test-Query: Filter nach Substring in content/title/url\n` +
            `4. Pruefe Anteil mit ` + '`meta.section`' + ` (Custom-Meta aus Memo 003 Phase 4, PRD-008)\n` +
            `5. PASS = alle Queries liefern Treffer mit Section-Label\n`

        await mkdir( dirname( outputPath ), { recursive: true } )
        await writeFile( outputPath, header + rows + '\n\n## Sample-Treffer\n\n' + details + footer )
        console.log( `Report written to ${ outputPath }` )
    }
}


const __filename = fileURLToPath( import.meta.url )
const __dirname = dirname( __filename )
const repoRoot = join( __dirname, '..' )
const fragmentDir = join( repoRoot, 'dist', 'pagefind', 'fragment' )
const outputPath = join( repoRoot, '..', '..', 'proofs', 'memo-init.github.io', 'pagefind-test-003.md' )

await PagefindTester.run( { fragmentDir, outputPath } )
