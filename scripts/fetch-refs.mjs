import fs from 'node:fs'
import path from 'node:path'


// Pulls the canonical spec version (and the few spec-owned fields the site shares)
// from the published `spec` repo's resolved refs into the site's hand-shaped
// `src/data/refs.json`. This closes the drift root: instead of `refs.json` being a
// hand-edited copy that silently diverges, the version-bearing fields are refreshed
// from the spec at build time. Site-owned fields (llmsFiles.docsUrl, docs.entryPoints,
// spec.specRepo, robotsTxt) are NOT in the spec schema and are preserved untouched —
// this is a targeted merge, never a wholesale overwrite of the richer site schema.
//
// Commit-hash pin (Memo 030, Kap 2): the spec is consumed at a PINNED commit via the
// `memo-init-spec` github dependency, NOT the wandering main branch — this is the drift sensor's
// anchor (pinned SHA vs spec HEAD). The pinned, installed dependency is the deterministic first
// source; the raw-URL fallback is pinned to the SAME sha (was: main). Bump both via `npm install
// memo-init-spec@github:Memo-Init/spec#<newSha>` after a verified re-bless (memo maintenance verify).
const PINNED_SPEC_SHA = 'f65d565a5195f1727b01ba2d795eda280f3946de'
// Resolution order (works locally and in CI):
//   1. installed pinned dependency node_modules/memo-init-spec (the commit-hash pin)
//   2. SPEC_REPO_DIR env (CI checks out the spec repo and points here), else local sibling ../spec
//   3. if <dir>/generated/refs.resolved.json exists on disk -> read it
//   4. otherwise -> fetch the published raw URL pinned to PINNED_SPEC_SHA
const PINNED_REFS_PATH = path.resolve( 'node_modules/memo-init-spec/generated/refs.resolved.json' )
const SPEC_REPO_DIR = process.env.SPEC_REPO_DIR || path.resolve( '../spec' )
const LOCAL_REFS_PATH = path.resolve( SPEC_REPO_DIR, 'generated/refs.resolved.json' )
const REMOTE_REFS_URL = `https://raw.githubusercontent.com/Memo-Init/spec/${ PINNED_SPEC_SHA }/generated/refs.resolved.json`
const OUT_PATH = path.resolve( 'src/data/refs.json' )
const EXPECTED_SCHEMA = 'refs/1.0.0'

const loadSpecRefs = async () => {
    if( fs.existsSync( PINNED_REFS_PATH ) ) {
        return { refs: JSON.parse( fs.readFileSync( PINNED_REFS_PATH, 'utf-8' ) ), source: PINNED_REFS_PATH }
    }
    if( fs.existsSync( LOCAL_REFS_PATH ) ) {
        return { refs: JSON.parse( fs.readFileSync( LOCAL_REFS_PATH, 'utf-8' ) ), source: LOCAL_REFS_PATH }
    }
    const response = await fetch( REMOTE_REFS_URL )
    if( !response.ok ) {
        console.error( `[fetch-refs] remote fetch failed (${ response.status }) at ${ REMOTE_REFS_URL }` )
        process.exit( 1 )
    }
    return { refs: await response.json(), source: REMOTE_REFS_URL }
}

const { refs: specRefs, source } = await loadSpecRefs()

if( specRefs.schemaVersion !== EXPECTED_SCHEMA ) {
    console.error( `[fetch-refs] schemaVersion mismatch — expected "${ EXPECTED_SCHEMA }", got "${ specRefs.schemaVersion }"` )
    process.exit( 1 )
}

if( specRefs.validation?.passed !== true ) {
    console.error( '[fetch-refs] spec validation.passed is not true — spec refs.resolved.json is invalid' )
    process.exit( 1 )
}

const specVersion = specRefs.spec?.currentVersion
if( typeof specVersion !== 'string' ) {
    console.error( '[fetch-refs] spec.currentVersion missing in spec refs.resolved.json' )
    process.exit( 1 )
}

if( !fs.existsSync( OUT_PATH ) ) {
    console.error( `[fetch-refs] site refs file not found at ${ OUT_PATH } — expected a hand-shaped base file to merge into` )
    process.exit( 1 )
}

const siteRefs = JSON.parse( fs.readFileSync( OUT_PATH, 'utf-8' ) )
const previousVersion = siteRefs.spec?.currentVersion

// Targeted merge: refresh only the version-bearing field from the spec; keep every
// site-owned field intact (spec.specRepo, docs.entryPoints, llmsFiles.docsUrl, robotsTxt).
siteRefs.spec = { ...siteRefs.spec, currentVersion: specVersion }

fs.writeFileSync( OUT_PATH, `${ JSON.stringify( siteRefs, null, 4 ) }\n`, 'utf-8' )

console.log( `[fetch-refs] OK — spec.currentVersion ${ previousVersion } -> ${ specVersion }` )
console.log( `[fetch-refs] source=${ source }` )
