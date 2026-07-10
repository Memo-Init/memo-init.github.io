// sync-spec.mjs — pull the spec docs payload into the Starlight content tree.
//
// Source (the sibling spec repo, post-Memo-064 namespace-first layout — the payload now
// lives per family under spec/<ns>/<version>/dist/, and the aggregates at the spec/ root):
//   ../spec/spec/memo/<version>/dist/spec/       — core chapters
//   ../spec/spec/workbench/<version>/dist/spec/   — workbench spec chapters
//   ../spec/spec/session/<version>/dist/spec/     — session spec chapters (absorbs the former SOP family, Memo 049)
//   ../spec/spec/meta-spec/<version>/dist/spec/   — Meta-Spec chapters (internal ns `meta-spec`, route /spec/, Memo 064 MI-S7)
//   ../spec/spec/manifest.json                    — the aggregate manifest
//
// Targets:
//   src/content/docs/memo/            — core Starlight content collection (route /memo/, Memo 064 MI-T10)
//   src/content/docs/workbench/       — workbench Starlight content collection
//   src/content/docs/session/         — session Starlight content collection
//   src/content/docs/spec/            — Meta-Spec Starlight content collection
//   src/data/manifest.json            — consumed by src/data/sidebar.mjs
//
// Normalization: the payload frontmatter carries richer metadata (spec_version,
// order, section, normative, generated_at, generator, edit_warning, ...). Starlight's
// docsSchema is strict and rejects unknown frontmatter keys, so each page is reduced
// to a SAFE frontmatter set: { title, description }. The remaining metadata lives in
// manifest.json (the single source of truth for ordering and grouping).
//
// Link routing: the spec generator now emits each family's OWN published route directly
// (memo → /specification/, workbench → /workbench/, session → /session/, spec → /spec/, derived
// from each family head — Memo 060 WI-023). The site therefore no longer re-routes an
// intermediate /specification/ token; it copies the payload body verbatim.

import { mkdir, writeFile, readFile, readdir, rm, copyFile } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'


const __dirname = path.dirname( fileURLToPath( import.meta.url ) )
const REPO_ROOT = path.resolve( __dirname, '..' )

// Spec repo dir: SPEC_REPO_DIR env (CI checks out the spec repo here), else local sibling ../spec.
const SPEC_REPO_DIR = process.env.SPEC_REPO_DIR
    ? path.resolve( process.env.SPEC_REPO_DIR )
    : path.resolve( REPO_ROOT, '..', 'spec' )
// Namespace-first root (post-Memo-064): payload per family under spec/<ns>/<version>/dist/,
// aggregates (manifest.json, refs.resolved.json) at the spec/ root.
const SPEC_NS_ROOT = path.resolve( SPEC_REPO_DIR, 'spec' )
const MEMO_SPEC_DIR = path.resolve( SPEC_NS_ROOT, 'memo', '0.1.0', 'dist', 'spec' )
const MEMO_DATA_DIR = path.resolve( SPEC_NS_ROOT, 'memo', '0.1.0', 'dist', 'data' )
const WORKBENCH_PAYLOAD_SRC = path.resolve( SPEC_NS_ROOT, 'workbench', '0.1.0', 'dist', 'spec' )
const WORKBENCH_DATA_DIR = path.resolve( SPEC_NS_ROOT, 'workbench', '0.1.0', 'dist', 'data' )
const SESSION_PAYLOAD_SRC = path.resolve( SPEC_NS_ROOT, 'session', '0.1.0', 'dist', 'spec' )
const SESSION_DATA_DIR = path.resolve( SPEC_NS_ROOT, 'session', '0.1.0', 'dist', 'data' )
// The meta family's INTERNAL namespace/dir is now `meta-spec` (Memo 064 MI-S7), while its published
// route stays /spec/ — so the SOURCE dir moves to spec/meta-spec/… but the target content dir and
// slugRoot below stay `spec` (the /spec/ route is URL-stable).
const SPEC_META_PAYLOAD_SRC = path.resolve( SPEC_NS_ROOT, 'meta-spec', '0.1.0', 'dist', 'spec' )
const SPEC_META_DATA_DIR = path.resolve( SPEC_NS_ROOT, 'meta-spec', '0.1.0', 'dist', 'data' )
const DIST_MANIFEST_JSON = path.resolve( SPEC_NS_ROOT, 'manifest.json' )

// Memo 064 MI-T10 (F5=A): the core/memo family is served under /memo/ (was /specification/); the
// sidebar label becomes "Memo" and old /specification/… URLs redirect (astro.config redirects).
const CONTENT_SPEC_DIR = path.resolve( REPO_ROOT, 'src', 'content', 'docs', 'memo' )
const CONTENT_WORKBENCH_DIR = path.resolve( REPO_ROOT, 'src', 'content', 'docs', 'workbench' )
const CONTENT_SESSION_DIR = path.resolve( REPO_ROOT, 'src', 'content', 'docs', 'session' )
const CONTENT_SPEC_META_DIR = path.resolve( REPO_ROOT, 'src', 'content', 'docs', 'spec' )

const DATA_DIR = path.resolve( REPO_ROOT, 'src', 'data' )
const DATA_MANIFEST = path.join( DATA_DIR, 'manifest.json' )

const SAFE_FRONTMATTER_KEYS = [ 'title', 'description' ]


class SpecSync {
    static async run() {
        SpecSync.#assertSource()

        const manifest = await SpecSync.#loadManifest()
        await SpecSync.#prepareTargetDirs()

        const workbenchSlugs = SpecSync.#collectFamilySlugs( { block: manifest.workbench } )
        const sessionSlugs = SpecSync.#collectFamilySlugs( { block: manifest.session } )
        const specMetaSlugs = SpecSync.#collectFamilySlugs( { block: manifest.spec } )

        const stats = {
            syncedCore: 0,
            syncedWorkbench: 0,
            syncedSession: 0,
            syncedSpecMeta: 0
        }

        await SpecSync.#syncCore( { manifest, stats } )
        await SpecSync.#syncFamily( {
            block: manifest.workbench,
            payloadSrc: WORKBENCH_PAYLOAD_SRC,
            contentDir: CONTENT_WORKBENCH_DIR,
            slugRoot: 'workbench',
            statsKey: 'syncedWorkbench',
            stats
        } )
        await SpecSync.#syncFamily( {
            block: manifest.session,
            payloadSrc: SESSION_PAYLOAD_SRC,
            contentDir: CONTENT_SESSION_DIR,
            slugRoot: 'session',
            statsKey: 'syncedSession',
            stats
        } )
        // Fourth family: the Meta-Specification (spec). Routed under /spec/, mirroring the
        // sibling-family sync (no-op when the block is absent/empty).
        await SpecSync.#syncFamily( {
            block: manifest.spec,
            payloadSrc: SPEC_META_PAYLOAD_SRC,
            contentDir: CONTENT_SPEC_META_DIR,
            slugRoot: 'spec',
            statsKey: 'syncedSpecMeta',
            stats
        } )

        // Prune orphan content pages — files whose slug is no longer in the manifest
        // (a chapter that was renamed/removed in the spec). These content dirs are
        // entirely sync-owned, so a slug not in the manifest is a stale build artifact.
        const coreSlugs = SpecSync.#collectFamilySlugs( { block: { files: manifest.files } } )
        stats.prunedCore = await SpecSync.#pruneContentDir( { contentDir: CONTENT_SPEC_DIR, slugs: coreSlugs } )
        stats.prunedWorkbench = await SpecSync.#pruneContentDir( { contentDir: CONTENT_WORKBENCH_DIR, slugs: workbenchSlugs } )
        stats.prunedSession = await SpecSync.#pruneContentDir( { contentDir: CONTENT_SESSION_DIR, slugs: sessionSlugs } )
        stats.prunedSpecMeta = await SpecSync.#pruneContentDir( { contentDir: CONTENT_SPEC_META_DIR, slugs: specMetaSlugs } )

        await mkdir( DATA_DIR, { recursive: true } )
        await writeFile(
            DATA_MANIFEST,
            JSON.stringify( manifest, null, 2 ) + '\n',
            'utf-8'
        )

        // Memo 052 Kap 8: copy the per-version spec-manifests (the single source of the
        // sub-category labels/order) into src/data so sidebar.mjs reads them instead of a
        // hardcoded lockstep map. Absent files degrade gracefully (sidebar.mjs falls back).
        stats.syncedSpecManifests = await SpecSync.#syncSpecManifests()

        SpecSync.#printSummary( { stats } )
        return { stats }
    }


    static async #syncSpecManifests() {
        const sources = [
            { family: 'core', src: path.join( MEMO_DATA_DIR, 'spec-manifest.json' ) },
            { family: 'workbench', src: path.join( WORKBENCH_DATA_DIR, 'spec-manifest.json' ) },
            { family: 'session', src: path.join( SESSION_DATA_DIR, 'spec-manifest.json' ) },
            { family: 'spec', src: path.join( SPEC_META_DATA_DIR, 'spec-manifest.json' ) }
        ]
        const copied = await Promise.all( sources.map( async ( { family, src } ) => {
            if( !existsSync( src ) ) {
                return 0
            }
            const dst = path.join( DATA_DIR, `spec-manifest.${ family }.json` )
            await copyFile( src, dst )
            return 1
        } ) )

        return copied.reduce( ( sum, n ) => sum + n, 0 )
    }


    static #assertSource() {
        if( !existsSync( MEMO_SPEC_DIR ) ) {
            throw new Error( `Spec dist source missing: ${ MEMO_SPEC_DIR }` )
        }
        if( !existsSync( DIST_MANIFEST_JSON ) ) {
            throw new Error( `manifest.json missing at ${ DIST_MANIFEST_JSON }` )
        }
    }


    static async #loadManifest() {
        const raw = await readFile( DIST_MANIFEST_JSON, 'utf-8' )
        const manifest = JSON.parse( raw )
        if( !Array.isArray( manifest.files ) ) {
            throw new Error( 'manifest.files is not an array' )
        }
        return manifest
    }


    static async #prepareTargetDirs() {
        await mkdir( CONTENT_SPEC_DIR, { recursive: true } )
        await mkdir( CONTENT_WORKBENCH_DIR, { recursive: true } )
        await mkdir( CONTENT_SESSION_DIR, { recursive: true } )
        await mkdir( CONTENT_SPEC_META_DIR, { recursive: true } )
    }


    static #collectFamilySlugs( { block } ) {
        const files = block && Array.isArray( block.files ) ? block.files : []
        return new Set( files.map( ( file ) => file.slug ) )
    }


    // Remove .md content pages whose slug is not in the given manifest slug set.
    // Returns the number of pruned files. Safe: these content dirs are sync-owned.
    static async #pruneContentDir( { contentDir, slugs } ) {
        let names
        try {
            names = await readdir( contentDir )
        } catch( error ) {
            return 0
        }
        const orphans = names
            .filter( ( name ) => name.endsWith( '.md' ) )
            .filter( ( name ) => !slugs.has( name.replace( /\.md$/, '' ) ) )
        await Promise.all( orphans.map( ( name ) => rm( path.join( contentDir, name ), { force: true } ) ) )
        orphans.forEach( ( name ) => console.log( `  - pruned orphan: ${ contentDir }/${ name }` ) )
        return orphans.length
    }


    static async #syncCore( { manifest, stats } ) {
        const tasks = manifest.files.map( async ( fileEntry ) => {
            const srcPath = path.join( MEMO_SPEC_DIR, fileEntry.filename )
            if( !existsSync( srcPath ) ) {
                throw new Error( `Manifest references missing core file: ${ fileEntry.filename }` )
            }
            const raw = await readFile( srcPath, 'utf-8' )
            const normalized = SpecSync.#normalize( { raw, fileEntry } )
            const dst = path.join( CONTENT_SPEC_DIR, `${ fileEntry.slug }.md` )
            await writeFile( dst, normalized, 'utf-8' )
            stats.syncedCore += 1
        } )
        await Promise.all( tasks )
    }


    // Generic sibling-family sync (workbench, session, spec). No-op when the family block is
    // absent/empty (so a not-yet-authored family does not break the sync).
    static async #syncFamily( { block, payloadSrc, contentDir, slugRoot, statsKey, stats } ) {
        if( !block || !Array.isArray( block.files ) || block.files.length === 0 ) {
            return
        }
        if( !existsSync( payloadSrc ) ) {
            throw new Error( `manifest.${ slugRoot } present but payload missing: ${ payloadSrc }` )
        }
        const tasks = block.files.map( async ( fileEntry ) => {
            const srcPath = path.join( payloadSrc, fileEntry.filename )
            if( !existsSync( srcPath ) ) {
                throw new Error( `manifest.${ slugRoot } references missing file: ${ slugRoot }/${ fileEntry.filename }` )
            }
            const raw = await readFile( srcPath, 'utf-8' )
            const normalized = SpecSync.#normalize( { raw, fileEntry } )
            const dst = path.join( contentDir, `${ fileEntry.slug }.md` )
            await writeFile( dst, normalized, 'utf-8' )
            stats[ statsKey ] += 1
        } )
        await Promise.all( tasks )
    }


    // Reduce frontmatter to the safe Starlight set and copy the body verbatim. The spec
    // generator already publishes each family's own route (Memo 060 WI-023), so the site no
    // longer re-routes an intermediate /specification/ token here.
    //
    // The payload frontmatter values are already valid YAML (correctly quoted by the
    // generator). Rather than re-parse and re-escape, the original whole lines for the
    // safe keys are kept VERBATIM.
    static #normalize( { raw, fileEntry } ) {
        const match = raw.match( /^---\n([\s\S]*?)\n---\n?/ )
        if( !match ) {
            throw new Error( `${ fileEntry.filename }: no frontmatter block found` )
        }

        const safeFm = SpecSync.#renderFrontmatter( { block: match[ 1 ], fileEntry } )

        const body = raw.slice( match[ 0 ].length ).replace( /^\n+/, '' )

        return `${ safeFm }${ body }`
    }


    // Keep the verbatim source line for each safe key (exact original quoting).
    // Falls back to a quoted manifest value only when a key is absent from the
    // payload frontmatter. Title is mandatory for Starlight.
    static #renderFrontmatter( { block, fileEntry } ) {
        const lines = block.split( '\n' )
        const picked = SAFE_FRONTMATTER_KEYS.map( ( key ) => {
            const found = lines.find( ( line ) => line.startsWith( `${ key }:` ) )
            if( found ) {
                return found
            }
            const fallback = key === 'title' ? fileEntry.title : ( fileEntry.description ?? '' )
            const esc = String( fallback ).replace( /\\/g, '\\\\' ).replace( /"/g, '\\"' )
            return `${ key }: "${ esc }"`
        } )
        return [ '---', ...picked, '---', '' ].join( '\n' ) + '\n'
    }


    static #printSummary( { stats } ) {
        console.log( '' )
        console.log( 'Spec sync complete' )
        console.log( `  Source (memo): ${ MEMO_SPEC_DIR }` )
        console.log( `  Core chapters: ${ stats.syncedCore } -> ${ CONTENT_SPEC_DIR }` )
        console.log( `  Workbench:     ${ stats.syncedWorkbench } -> ${ CONTENT_WORKBENCH_DIR }` )
        console.log( `  Session:       ${ stats.syncedSession } -> ${ CONTENT_SESSION_DIR }` )
        console.log( `  Meta-Spec:     ${ stats.syncedSpecMeta } -> ${ CONTENT_SPEC_META_DIR }` )
        console.log( `  Manifest:      ${ DATA_MANIFEST }` )
    }
}


SpecSync
    .run()
    .then( () => process.exit( 0 ) )
    .catch( ( err ) => {
        console.error( 'Sync failed:', err.message )
        process.exit( 1 )
    } )
