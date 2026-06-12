// check-published-llms.mjs — PRD-010 (Memo 004 Kap 8)
// HEAD/GET check of every published URL declared in src/data/refs.json
// (docs canonical + entry points, llms files, GitHub, robots.txt llms files).
// Each must return HTTP 200, otherwise the script exits non-zero with a list.
//
// Ported from flowmcp.github.io scripts/check-published-llms.mjs. memo-init refs
// has no github.sponsorsUrl, so that push is dropped.
//
// Base override: by default the URLs use the canonical production host. Pass a
// base via the LLMS_CHECK_BASE env var (e.g. http://localhost:4321) to verify a
// local `npm run preview` instead.

import { readFile } from 'node:fs/promises'
import { resolve } from 'node:path'


const REFS_PATH = resolve( 'src/data/refs.json' )
const BASE_OVERRIDE = process.env.LLMS_CHECK_BASE || null


const rebase = ( { url, canonical, base } ) => {
    if( !base ) { return url }
    if( typeof url !== 'string' ) { return url }
    if( url.startsWith( canonical ) ) { return base + url.slice( canonical.length ) }
    return url
}


const collectUrls = ( { refs } ) => {
    const urls = []
    const canonical = refs.docs.canonical
    const base = BASE_OVERRIDE

    const pushUrl = ( { url, source } ) => {
        if( typeof url === 'string' && url.startsWith( 'http' ) ) {
            urls.push( { url: rebase( { url, canonical, base } ), source } )
        }
    }

    pushUrl( { url: refs.docs.canonical, source: 'docs.canonical' } )
    Object
        .entries( refs.docs.entryPoints )
        .forEach( ( [ key, pathSegment ] ) => {
            pushUrl( { url: `${ refs.docs.canonical }${ pathSegment }`, source: `docs.entryPoints.${ key }` } )
        } )

    Object
        .entries( refs.llmsFiles )
        .forEach( ( [ key, url ] ) => {
            pushUrl( { url, source: `llmsFiles.${ key }` } )
        } )

    pushUrl( { url: refs.github.organization, source: 'github.organization' } )
    pushUrl( { url: refs.github.specRepo, source: 'github.specRepo' } )

    refs.robotsTxt.publishedLlmsFiles
        .forEach( ( pathSegment ) => {
            pushUrl( { url: `${ refs.docs.canonical }${ pathSegment }`, source: `robotsTxt.publishedLlmsFiles${ pathSegment }` } )
        } )

    return urls
}


const checkUrl = async ( { url } ) => {
    try {
        const headResponse = await fetch( url, { method: 'HEAD', redirect: 'follow' } )
        if( headResponse.ok ) {
            return { status: headResponse.status, ok: true }
        }
        const getResponse = await fetch( url, { method: 'GET', redirect: 'follow' } )
        return { status: getResponse.status, ok: getResponse.ok }
    } catch( error ) {
        return { status: 0, ok: false, error: error.message }
    }
}


const main = async () => {
    const refs = JSON.parse( await readFile( REFS_PATH, 'utf-8' ) )
    const urls = collectUrls( { refs } )

    console.log( `Checking ${ urls.length } URLs${ BASE_OVERRIDE ? ` (base: ${ BASE_OVERRIDE })` : '' }...` )
    const results = []

    await Promise.all( urls.map( async ( item ) => {
        const { status, ok, error } = await checkUrl( { url: item.url } )
        results.push( { ...item, status, ok, error } )
    } ) )

    const failed = results.filter( ( result ) => result.ok === false )
    if( failed.length > 0 ) {
        console.error( '\nFAILED:' )
        failed.forEach( ( result ) => {
            const errorPart = result.error ? ` — ${ result.error }` : ''
            console.error( `  [${ result.status || 'ERR' }] ${ result.url }  (${ result.source })${ errorPart }` )
        } )
        process.exit( 1 )
    }

    console.log( `OK: all ${ results.length } URLs returned HTTP 200` )
}


main()
    .catch( ( error ) => {
        console.error( error )
        process.exit( 1 )
    } )
