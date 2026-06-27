// spec-head.mjs — Memo 053 (Kap 1, Fix B). Resolve the spec repo's current HEAD commit
// SHA from its `.git` directory WITHOUT shelling out (pure fs, matching the other build
// scripts). This commit SHA is the deterministic freshness anchor: "which spec commit is
// the site built from". Shared by generate-build-stamp.mjs (emit) and check-freshness.mjs
// (verify). Handles all three checkout shapes: detached HEAD (CI), loose ref, packed-refs.

import { readFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import path from 'node:path'


// Spec repo dir: SPEC_REPO_DIR env (CI checks out the spec repo here), else local sibling
// ../spec. CWD-relative like fetch-refs.mjs — npm always runs from the package root.
const specRepoDir = () => process.env.SPEC_REPO_DIR
    ? path.resolve( process.env.SPEC_REPO_DIR )
    : path.resolve( '../spec' )


const resolveSpecHeadSha = async () => {
    const gitDir = path.resolve( specRepoDir(), '.git' )
    if( existsSync( gitDir ) !== true ) {
        return { ok: false, sha: null, reason: `no .git at ${ gitDir }` }
    }

    const head = ( await readFile( path.join( gitDir, 'HEAD' ), 'utf-8' ) ).trim()
    if( head.startsWith( 'ref:' ) !== true ) {
        // detached HEAD (actions/checkout) — HEAD already holds the raw sha
        return { ok: true, sha: head, reason: 'detached HEAD' }
    }

    const ref = head.replace( 'ref:', '' ).trim()

    const loosePath = path.join( gitDir, ref )
    if( existsSync( loosePath ) === true ) {
        return { ok: true, sha: ( await readFile( loosePath, 'utf-8' ) ).trim(), reason: 'loose ref' }
    }

    const packedPath = path.join( gitDir, 'packed-refs' )
    if( existsSync( packedPath ) === true ) {
        const lines = ( await readFile( packedPath, 'utf-8' ) ).split( '\n' )
        const match = lines.find( ( line ) => line.endsWith( ` ${ ref }` ) )
        if( match !== undefined ) {
            return { ok: true, sha: match.split( ' ' )[ 0 ], reason: 'packed-refs' }
        }
    }

    return { ok: false, sha: null, reason: `could not resolve ${ ref }` }
}


export { resolveSpecHeadSha, specRepoDir }
