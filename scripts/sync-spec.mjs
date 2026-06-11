// sync-spec.mjs — pull the spec docs payload into the Starlight content tree.
//
// Source (local sibling spec repo):
//   ../spec/generated/docs-payload/        — 19 core chapters + manifest.json
//   ../spec/generated/docs-payload/workbench/ — 7 workbench sub-spec chapters
//
// Targets:
//   src/content/docs/specification/   — core Starlight content collection
//   src/content/docs/workbench/       — workbench Starlight content collection
//   src/data/manifest.json            — consumed by src/data/sidebar.mjs
//
// Normalization: the payload frontmatter carries richer metadata (spec_version,
// order, section, normative, generated_at, generator, edit_warning, ...). Starlight's
// docsSchema is strict and rejects unknown frontmatter keys, so each page is reduced
// to a SAFE frontmatter set: { title, description }. The remaining metadata lives in
// manifest.json (the single source of truth for ordering and grouping).
//
// Link rewriting: workbench chapters cross-link each other via /specification/<slug>/
// in the payload, but their Starlight routes live under /workbench/<slug>/. Those
// links are rewritten to the correct route. Core links already point at /specification/.

import { mkdir, writeFile, readFile, readdir } from 'node:fs/promises'
import { existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'


const __dirname = path.dirname( fileURLToPath( import.meta.url ) )
const REPO_ROOT = path.resolve( __dirname, '..' )

// Spec repo dir: SPEC_REPO_DIR env (CI checks out the spec repo here), else local sibling ../spec.
const SPEC_REPO_DIR = process.env.SPEC_REPO_DIR
    ? path.resolve( process.env.SPEC_REPO_DIR )
    : path.resolve( REPO_ROOT, '..', 'spec' )
const SPEC_REPO_PAYLOAD = path.resolve( SPEC_REPO_DIR, 'generated', 'docs-payload' )
const WORKBENCH_PAYLOAD_SRC = path.resolve( SPEC_REPO_PAYLOAD, 'workbench' )

const CONTENT_SPEC_DIR = path.resolve( REPO_ROOT, 'src', 'content', 'docs', 'specification' )
const CONTENT_WORKBENCH_DIR = path.resolve( REPO_ROOT, 'src', 'content', 'docs', 'workbench' )

const DATA_DIR = path.resolve( REPO_ROOT, 'src', 'data' )
const DATA_MANIFEST = path.join( DATA_DIR, 'manifest.json' )

const SAFE_FRONTMATTER_KEYS = [ 'title', 'description' ]


class SpecSync {
    static async run() {
        SpecSync.#assertSource()

        const manifest = await SpecSync.#loadManifest()
        await SpecSync.#prepareTargetDirs()

        const workbenchSlugs = SpecSync.#collectWorkbenchSlugs( { manifest } )

        const stats = {
            syncedCore: 0,
            syncedWorkbench: 0
        }

        await SpecSync.#syncCore( { manifest, stats } )
        await SpecSync.#syncWorkbench( { manifest, workbenchSlugs, stats } )

        await mkdir( DATA_DIR, { recursive: true } )
        await writeFile(
            DATA_MANIFEST,
            JSON.stringify( manifest, null, 2 ) + '\n',
            'utf-8'
        )

        SpecSync.#printSummary( { stats } )
        return { stats }
    }


    static #assertSource() {
        if( !existsSync( SPEC_REPO_PAYLOAD ) ) {
            throw new Error( `Spec payload source missing: ${ SPEC_REPO_PAYLOAD }` )
        }
        const manifestPath = path.join( SPEC_REPO_PAYLOAD, 'manifest.json' )
        if( !existsSync( manifestPath ) ) {
            throw new Error( `manifest.json missing at ${ manifestPath }` )
        }
    }


    static async #loadManifest() {
        const manifestPath = path.join( SPEC_REPO_PAYLOAD, 'manifest.json' )
        const raw = await readFile( manifestPath, 'utf-8' )
        const manifest = JSON.parse( raw )
        if( !Array.isArray( manifest.files ) ) {
            throw new Error( 'manifest.files is not an array' )
        }
        return manifest
    }


    static async #prepareTargetDirs() {
        await mkdir( CONTENT_SPEC_DIR, { recursive: true } )
        await mkdir( CONTENT_WORKBENCH_DIR, { recursive: true } )
    }


    static #collectWorkbenchSlugs( { manifest } ) {
        const files = manifest.workbench && Array.isArray( manifest.workbench.files )
            ? manifest.workbench.files
            : []
        return new Set( files.map( ( file ) => file.slug ) )
    }


    static async #syncCore( { manifest, stats } ) {
        const tasks = manifest.files.map( async ( fileEntry ) => {
            const srcPath = path.join( SPEC_REPO_PAYLOAD, fileEntry.filename )
            if( !existsSync( srcPath ) ) {
                throw new Error( `Manifest references missing core file: ${ fileEntry.filename }` )
            }
            const raw = await readFile( srcPath, 'utf-8' )
            const normalized = SpecSync.#normalize( { raw, fileEntry, rewriteWorkbenchSlugs: null } )
            const dst = path.join( CONTENT_SPEC_DIR, `${ fileEntry.slug }.md` )
            await writeFile( dst, normalized, 'utf-8' )
            stats.syncedCore += 1
        } )
        await Promise.all( tasks )
    }


    static async #syncWorkbench( { manifest, workbenchSlugs, stats } ) {
        if( !manifest.workbench || !Array.isArray( manifest.workbench.files ) ) {
            return
        }
        if( !existsSync( WORKBENCH_PAYLOAD_SRC ) ) {
            throw new Error( `manifest.workbench present but workbench payload missing: ${ WORKBENCH_PAYLOAD_SRC }` )
        }
        const tasks = manifest.workbench.files.map( async ( fileEntry ) => {
            const srcPath = path.join( WORKBENCH_PAYLOAD_SRC, fileEntry.filename )
            if( !existsSync( srcPath ) ) {
                throw new Error( `manifest.workbench references missing file: workbench/${ fileEntry.filename }` )
            }
            const raw = await readFile( srcPath, 'utf-8' )
            const normalized = SpecSync.#normalize( { raw, fileEntry, rewriteWorkbenchSlugs: workbenchSlugs } )
            const dst = path.join( CONTENT_WORKBENCH_DIR, `${ fileEntry.slug }.md` )
            await writeFile( dst, normalized, 'utf-8' )
            stats.syncedWorkbench += 1
        } )
        await Promise.all( tasks )
    }


    // Reduce frontmatter to the safe Starlight set and (for workbench) rewrite
    // /specification/<slug>/ links to /workbench/<slug>/ where slug is a known
    // workbench chapter. Returns the rewritten file text.
    //
    // The payload frontmatter values are already valid YAML (correctly quoted by
    // the generator). Rather than re-parse and re-escape (which double-escaped
    // embedded \" sequences and broke YAML), the original whole lines for the safe
    // keys are kept VERBATIM. Each safe key is matched as a top-level frontmatter
    // line (key followed by ":"), preserving its exact quoting.
    static #normalize( { raw, fileEntry, rewriteWorkbenchSlugs } ) {
        const match = raw.match( /^---\n([\s\S]*?)\n---\n?/ )
        if( !match ) {
            throw new Error( `${ fileEntry.filename }: no frontmatter block found` )
        }

        const safeFm = SpecSync.#renderFrontmatter( { block: match[ 1 ], fileEntry } )

        let body = raw.slice( match[ 0 ].length ).replace( /^\n+/, '' )

        if( rewriteWorkbenchSlugs ) {
            body = SpecSync.#rewriteWorkbenchLinks( { body, workbenchSlugs: rewriteWorkbenchSlugs } )
        }

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


    static #rewriteWorkbenchLinks( { body, workbenchSlugs } ) {
        return body.replace( /\/specification\/([a-z0-9-]+)\//g, ( whole, slug ) => {
            if( workbenchSlugs.has( slug ) ) {
                return `/workbench/${ slug }/`
            }
            return whole
        } )
    }


    static #printSummary( { stats } ) {
        console.log( '' )
        console.log( 'Spec sync complete' )
        console.log( `  Source:        ${ SPEC_REPO_PAYLOAD }` )
        console.log( `  Core chapters: ${ stats.syncedCore } -> ${ CONTENT_SPEC_DIR }` )
        console.log( `  Workbench:     ${ stats.syncedWorkbench } -> ${ CONTENT_WORKBENCH_DIR }` )
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
