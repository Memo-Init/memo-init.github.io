// generate-build-stamp.mjs — Memo 053 (Kap 1, Fix B — "nie wieder raten"). Emits
// public/build-stamp.json so the DEPLOYED site carries a machine-checkable freshness
// anchor: which spec commit it was built from + when. Astro copies public/ into dist/,
// so the stamp is served at https://memo-init.github.io/build-stamp.json. The companion
// check-freshness.mjs compares the LIVE stamp against the current spec HEAD.
//
// Note on the CDN/browser cache (R5 rank-3): GitHub Pages serves HTML through a CDN with
// a short TTL we do not control; Astro already fingerprints JS/CSS assets (hashed names).
// The stamp is the deterministic answer to "is it fresh?" that replaces guessing by eye.

import { readFile, writeFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'

import { resolveSpecFromCommit } from './spec-head.mjs'


const OUT_PATH = path.resolve( 'public/build-stamp.json' )
const MANIFEST_PATH = path.resolve( 'src/data/manifest.json' )


const readSpecVersion = async () => {
    if( existsSync( MANIFEST_PATH ) !== true ) {
        return null
    }
    const manifest = JSON.parse( await readFile( MANIFEST_PATH, 'utf-8' ) )
    return typeof manifest.spec_version === 'string' ? manifest.spec_version : null
}


const main = async () => {
    const head = await resolveSpecFromCommit()
    const specVersion = await readSpecVersion()

    const stamp = {
        specHeadSha: head.ok === true ? head.sha : null,
        specHeadResolvedVia: head.reason,
        specVersion,
        generatedAt: new Date().toISOString()
    }

    await writeFile( OUT_PATH, JSON.stringify( stamp, null, 4 ) + '\n', 'utf-8' )

    console.log( `[build-stamp] specHeadSha=${ stamp.specHeadSha || 'null' } specVersion=${ specVersion || 'null' } generatedAt=${ stamp.generatedAt }` )
    if( stamp.specHeadSha === null ) {
        console.warn( `[build-stamp] WARNING: spec HEAD unresolved (${ head.reason }) — freshness check will report INCONCLUSIVE` )
    }
}


main()
    .catch( ( error ) => {
        console.error( error )
        process.exit( 1 )
    } )
