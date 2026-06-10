// generate-llms-txt.mjs — produce public/llms.txt, the machine-readable index.
//
// Primary source: the spec repo already ships a fully concatenated llms.txt at
//   ../spec/generated/llms.txt
// It is copied verbatim into public/llms.txt so /llms.txt is served as a static
// asset by GitHub Pages. If the source is missing (spec not generated yet), a
// minimal site-level index is written instead so the build never fails.

import { mkdir, writeFile, readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'


const __dirname = path.dirname( fileURLToPath( import.meta.url ) )
const REPO_ROOT = path.resolve( __dirname, '..' )

const SPEC_LLMS_SRC = path.resolve( REPO_ROOT, '..', 'spec', 'generated', 'llms.txt' )
const PUBLIC_DIR = path.resolve( REPO_ROOT, 'public' )
const OUTPUT_LLMS = path.join( PUBLIC_DIR, 'llms.txt' )


const MINIMAL_INDEX = `# memo-init — llms.txt Index

> Memo-driven, agentic software engineering. Guardrails first.

The full concatenated specification was not available at build time.

Specification: https://memo-init.github.io/specification/overview/
Workbench:     https://memo-init.github.io/workbench/overview/
GitHub:        https://github.com/memo-init
`


const run = async () => {
    await mkdir( PUBLIC_DIR, { recursive: true } )

    if( existsSync( SPEC_LLMS_SRC ) ) {
        const content = await readFile( SPEC_LLMS_SRC, 'utf-8' )
        await writeFile( OUTPUT_LLMS, content, 'utf-8' )
        console.log( `llms.txt copied from spec repo: ${ content.length } chars` )
        console.log( `  source: ${ SPEC_LLMS_SRC }` )
        console.log( `  -> ${ OUTPUT_LLMS }` )
        return
    }

    await writeFile( OUTPUT_LLMS, MINIMAL_INDEX, 'utf-8' )
    console.log( `llms.txt source missing — wrote minimal index: ${ MINIMAL_INDEX.length } chars` )
    console.log( `  -> ${ OUTPUT_LLMS }` )
}


run()
    .then( () => process.exit( 0 ) )
    .catch( ( err ) => {
        console.error( 'generate-llms-txt failed:', err.message )
        process.exit( 1 )
    } )
