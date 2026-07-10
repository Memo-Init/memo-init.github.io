// copy-llms.mjs — Memo 064 (C2 / MI-T3), replaces the retired generate-llms-txt.mjs.
//
// F14=B ("Docs generate no content"): the site MUST NOT synthesize its llms bundle
// from its own Astro pages (src/content/docs/**). It copies through the bundles that
// the sibling spec repo already emits and serves the result. Nothing site-authored is
// added — this is pure pass-through of spec artifacts, not generation.
//
// Post-Memo-064 the spec is namespace-first and emits one spec-only llms.txt PER FAMILY:
//   <SPEC_REPO_DIR>/spec/<ns>/0.1.0/dist/generated/llms.txt   (ns = memo | workbench | session | spec)
// The single published bundle /llms.txt is the byte concatenation of the four family
// bundles in this fixed order (memo, workbench, session, spec) — the "full content"
// pass-through. Verifiable: `cat` of the four sources equals public/llms.txt byte for byte.
//
// Precondition (PRD-007 / MI-S1): the spec side must have emitted these files before the
// copy runs. A missing source aborts loudly — never a silent fallback to self-generation.

import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'


const __dirname = path.dirname( fileURLToPath( import.meta.url ) )
const REPO_ROOT = path.resolve( __dirname, '..' )

// Spec repo dir: SPEC_REPO_DIR env (CI checks out the spec repo here), else local sibling
// ../spec — the SAME resolution as sync-spec.mjs / fetch-refs.mjs (single source, no drift).
const SPEC_REPO_DIR = process.env.SPEC_REPO_DIR
    ? path.resolve( process.env.SPEC_REPO_DIR )
    : path.resolve( REPO_ROOT, '..', 'spec' )
const SPEC_NS_ROOT = path.resolve( SPEC_REPO_DIR, 'spec' )

// Fixed family order — mirrors sync-spec.mjs and the refs.resolved.json key order.
const FAMILIES = [ 'memo', 'workbench', 'session', 'spec' ]
const SPEC_VERSION = '0.1.0'

const PUBLIC_DIR = path.resolve( REPO_ROOT, 'public' )
const OUTPUT_BUNDLE = path.join( PUBLIC_DIR, 'llms.txt' )


const familyBundlePath = ( { family } ) => {
    return path.resolve( SPEC_NS_ROOT, family, SPEC_VERSION, 'dist', 'generated', 'llms.txt' )
}


const assertSources = ( { sources } ) => {
    const missing = sources
        .filter( ( { file } ) => existsSync( file ) !== true )
        .map( ( { family, file } ) => `${ family } (${ file })` )
    if( missing.length > 0 ) {
        throw new Error( `spec llms bundle(s) missing — the spec side must emit these first (PRD-007/MI-S1): ${ missing.join( ', ' ) }` )
    }
}


const main = async () => {
    await mkdir( PUBLIC_DIR, { recursive: true } )

    const sources = FAMILIES.map( ( family ) => ( { family, file: familyBundlePath( { family } ) } ) )
    assertSources( { sources } )

    const buffers = await Promise.all( sources.map( ( { file } ) => readFile( file ) ) )
    const bundle = Buffer.concat( buffers )

    await writeFile( OUTPUT_BUNDLE, bundle )

    const parts = sources.map( ( { family } ) => family ).join( ' + ' )
    console.log( `[copy-llms] wrote ${ OUTPUT_BUNDLE } (${ bundle.length } bytes) — pass-through concat of ${ parts }` )
}


main()
    .then( () => process.exit( 0 ) )
    .catch( ( error ) => {
        console.error( `[copy-llms] ERROR: ${ error.message }` )
        process.exit( 1 )
    } )
