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
// Single-source resolution (Memo 064, C2 / MI-T6 — dual-source-bug fix): the site's content
// (sync-spec) reads the LIVE sibling spec repo, so refs MUST come from the same place, or version
// and SHA drift against the copied content. The former order preferred a PINNED node_modules copy
// (memo-init-spec github dependency) that lagged the sibling by ~170 commits — that stale-first
// preference is removed. The live sibling now wins; the pinned copy and the raw URL remain only as
// last-ditch fallbacks (never reached when the sibling is present, which every real build requires).
//
// Post-Memo-064 the spec is namespace-first: the aggregate resolved refs live at the spec/ root
// (`spec/refs.resolved.json`), not under a top-level `dist/`.
//   1. SPEC_REPO_DIR env (CI checks out the spec repo and points here), else local sibling ../spec
//      -> <dir>/spec/refs.resolved.json  (the SAME source sync-spec resolves from)
//   2. installed pinned dependency node_modules/memo-init-spec (legacy fallback only)
//   3. otherwise -> fetch the published raw URL pinned to PINNED_SPEC_SHA
const PINNED_SPEC_SHA = 'f65d565a5195f1727b01ba2d795eda280f3946de'
const SPEC_REPO_DIR = process.env.SPEC_REPO_DIR || path.resolve( '../spec' )
const LOCAL_REFS_PATH = path.resolve( SPEC_REPO_DIR, 'spec/refs.resolved.json' )
const PINNED_REFS_PATH = path.resolve( 'node_modules/memo-init-spec/dist/refs.resolved.json' )
const REMOTE_REFS_URL = `https://raw.githubusercontent.com/Memo-Init/spec/${ PINNED_SPEC_SHA }/spec/refs.resolved.json`
const OUT_PATH = path.resolve( 'src/data/refs.json' )
const EXPECTED_SCHEMA = 'refs/1.0.0'

const loadSpecRefs = async () => {
    if( fs.existsSync( LOCAL_REFS_PATH ) ) {
        return { refs: JSON.parse( fs.readFileSync( LOCAL_REFS_PATH, 'utf-8' ) ), source: LOCAL_REFS_PATH }
    }
    if( fs.existsSync( PINNED_REFS_PATH ) ) {
        return { refs: JSON.parse( fs.readFileSync( PINNED_REFS_PATH, 'utf-8' ) ), source: PINNED_REFS_PATH }
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
