// Sidebar loader for the memo-init documentation site.
// Reads src/data/manifest.json (synced from the spec repo by sync-spec.mjs) and
// produces the Starlight sidebar items for the core specification (grouped by
// sidebar_group) plus the workbench sub-spec. Robust by design — if the manifest
// is missing (fresh checkout, sync not yet run), a minimal sidebar is returned so
// the build never hard-fails on a cold start.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'


const __dirname = dirname( fileURLToPath( import.meta.url ) )
const MANIFEST_PATH = resolve( __dirname, 'manifest.json' )

const GROUP_LABELS = {
    introduction: 'Introduction',
    specification: 'Core Specification'
}

const GROUP_ORDER = [ 'introduction', 'specification' ]


class SidebarLoader {
    static buildSidebar() {
        const manifest = SidebarLoader.#loadManifest()
        if( !manifest ) {
            return SidebarLoader.#minimalSidebar()
        }

        const specVersion = typeof manifest.spec_version === 'string' && manifest.spec_version.length > 0
            ? manifest.spec_version
            : '0.0.0'

        const specItems = SidebarLoader.#buildSpecItems( { manifest } )
        const workbenchItems = SidebarLoader.#buildWorkbenchItems( { manifest } )

        return { specItems, workbenchItems, specVersion }
    }


    static #loadManifest() {
        if( !existsSync( MANIFEST_PATH ) ) {
            return null
        }
        const raw = readFileSync( MANIFEST_PATH, 'utf8' )
        return JSON.parse( raw )
    }


    static #buildSpecItems( { manifest } ) {
        const files = Array.isArray( manifest.files ) ? manifest.files : []
        const sorted = [ ...files ].sort( ( a, b ) => a.order - b.order )

        const buckets = {}
        sorted.forEach( ( file ) => {
            const key = typeof file.sidebar_group === 'string' ? file.sidebar_group : 'specification'
            if( !buckets[ key ] ) {
                buckets[ key ] = []
            }
            buckets[ key ].push( {
                label: file.title,
                slug: `specification/${ file.slug }`
            } )
        } )

        const orderedKeys = GROUP_ORDER.filter( ( key ) => buckets[ key ] )
        const extraKeys = Object
            .keys( buckets )
            .filter( ( key ) => !GROUP_ORDER.includes( key ) )
        const allKeys = [ ...orderedKeys, ...extraKeys ]

        return allKeys.map( ( key ) => {
            return {
                label: GROUP_LABELS[ key ] ?? key,
                collapsed: false,
                items: buckets[ key ]
            }
        } )
    }


    static #buildWorkbenchItems( { manifest } ) {
        const workbench = manifest.workbench && Array.isArray( manifest.workbench.files )
            ? manifest.workbench.files
            : []
        const sorted = [ ...workbench ].sort( ( a, b ) => a.order - b.order )

        return sorted.map( ( file ) => {
            return {
                label: file.title,
                slug: `workbench/${ file.slug }`
            }
        } )
    }


    static #minimalSidebar() {
        return {
            specItems: [],
            workbenchItems: [],
            specVersion: '0.0.0'
        }
    }
}


export { SidebarLoader }
