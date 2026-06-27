// check-freshness.mjs — Memo 053 (Kap 1, Fix B). Deterministic, machine answer to
// "is the live site fresh?" — never by eye again. Run in the Landing step after a push.
//
// Ternary, consistent with the system's PASS / BLOCKED / INCONCLUSIVE gate (Memo 053 F10):
//   exit 0  PASS          live build-stamp.specHeadSha == current local spec HEAD
//   exit 1  BLOCKED       live stamp is behind the current spec HEAD (the site is STALE)
//   exit 2  INCONCLUSIVE  could not resolve local HEAD, or fetch/parse the live stamp
//
// Base override: LLMS_CHECK_BASE (e.g. http://localhost:4321 against `npm run preview`).

import { resolveSpecHeadSha } from './spec-head.mjs'


const BASE = process.env.LLMS_CHECK_BASE || 'https://memo-init.github.io'
const STAMP_URL = `${ BASE }/build-stamp.json`


const fetchLiveStamp = async () => {
    try {
        const response = await fetch( STAMP_URL, { redirect: 'follow' } )
        if( response.ok !== true ) {
            return { ok: false, reason: `HTTP ${ response.status } at ${ STAMP_URL }` }
        }
        return { ok: true, stamp: await response.json() }
    } catch( error ) {
        return { ok: false, reason: error.message }
    }
}


const main = async () => {
    const local = await resolveSpecHeadSha()
    if( local.ok !== true ) {
        console.error( `[freshness] INCONCLUSIVE — local spec HEAD unresolved: ${ local.reason }` )
        process.exit( 2 )
    }

    const live = await fetchLiveStamp()
    if( live.ok !== true ) {
        console.error( `[freshness] INCONCLUSIVE — live stamp unavailable: ${ live.reason }` )
        process.exit( 2 )
    }

    const liveSha = typeof live.stamp.specHeadSha === 'string' ? live.stamp.specHeadSha : null
    if( liveSha === null ) {
        console.error( '[freshness] INCONCLUSIVE — live stamp carries no specHeadSha' )
        process.exit( 2 )
    }

    if( liveSha === local.sha ) {
        console.log( `[freshness] PASS — live site built from current spec HEAD ${ local.sha } (generatedAt ${ live.stamp.generatedAt })` )
        process.exit( 0 )
    }

    console.error( '[freshness] BLOCKED — live site is STALE.' )
    console.error( `  live  specHeadSha: ${ liveSha } (generatedAt ${ live.stamp.generatedAt })` )
    console.error( `  local spec HEAD  : ${ local.sha }` )
    process.exit( 1 )
}


main()
    .catch( ( error ) => {
        console.error( error )
        process.exit( 2 )
    } )
