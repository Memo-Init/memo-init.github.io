// Sidebar loader for the memo-init documentation site.
// Reads src/data/manifest.json (synced from the spec repo by sync-spec.mjs) and
// produces the Starlight sidebar items for three sibling spec families:
//   - core specification (grouped by sidebar_group)
//   - workbench spec (own grouped sidebar + own version)
//   - session spec (own grouped sidebar + own version; absorbs the former SOP family, Memo 049)
// Robust by design — if the manifest is missing (fresh checkout, sync not yet run),
// a minimal sidebar is returned so the build never hard-fails on a cold start.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'


const __dirname = dirname( fileURLToPath( import.meta.url ) )
const MANIFEST_PATH = resolve( __dirname, 'manifest.json' )

// Lockstep with repos/spec/scripts/generate-manifest.mjs SIDEBAR_GROUP_BY_ORDER (Memo 041
// Teil A). The 12-group set for the core spec; `specification` stays as the ultimate label
// fallback for any unlabelled extra key.
const GROUP_LABELS = {
    introduction: 'Introduction',
    input: 'Input',
    initialisierung: 'Initialisierung',
    revision: 'Revision',
    execution: 'Execution',
    procedure: 'Procedure',
    behavior: 'Behavior',
    health: 'Health',
    agents: 'Agents',
    git: 'Git & Repo',
    skills: 'Skills',
    specification: 'Core Specification'
}

const GROUP_ORDER = [ 'introduction', 'input', 'initialisierung', 'revision', 'execution', 'procedure', 'behavior', 'health', 'agents', 'git', 'skills' ]

// Workbench family groups (lockstep with workbenchSidebarGroupFromFilename in the spec
// generate-manifest.mjs, Memo 049 Kap 9): Introduction → Root → Projects → Folders →
// Custom → CLI → Tools → Core. All labels are Capitalized (the Kap 9 display rule — the
// former map left 'core'/'wiki'/'custom' unlabelled, so they rendered raw lowercase).
const WORKBENCH_GROUP_LABELS = {
    introduction: 'Introduction',
    root: 'Root',
    projects: 'Projects',
    folders: 'Folders',
    custom: 'Custom',
    cli: 'CLI & Scripts',
    tools: 'Tools',
    core: 'Core'
}

const WORKBENCH_GROUP_ORDER = [ 'introduction', 'root', 'projects', 'folders', 'custom', 'cli', 'tools', 'core' ]

// Session family (Genesis Root + absorbed SOP area, Memo 049): Introduction → SOP →
// Genesis Root → Enforcement → CLI → Recovery. Labels Capitalized.
const SESSION_GROUP_LABELS = {
    introduction: 'Introduction',
    sop: 'SOP',
    'genesis-root': 'Genesis Root',
    enforcement: 'Enforcement',
    cli: 'CLI',
    recovery: 'Recovery'
}
const SESSION_GROUP_ORDER = [ 'introduction', 'sop', 'genesis-root', 'enforcement', 'cli', 'recovery' ]


class SidebarLoader {
    static buildSidebar() {
        const manifest = SidebarLoader.#loadManifest()
        if( !manifest ) {
            return SidebarLoader.#minimalSidebar()
        }

        const specVersion = SidebarLoader.#versionOf( { value: manifest.spec_version } )
        const workbenchVersion = SidebarLoader.#versionOf( { value: manifest.workbench?.version } )
        const sessionVersion = SidebarLoader.#versionOf( { value: manifest.session?.version } )

        const specItems = SidebarLoader.#buildSpecItems( { manifest } )
        const workbenchItems = SidebarLoader.#buildFamilyItems( {
            files: manifest.workbench?.files,
            slugRoot: 'workbench',
            groupOrder: WORKBENCH_GROUP_ORDER,
            groupLabels: WORKBENCH_GROUP_LABELS
        } )
        const sessionItems = SidebarLoader.#buildFamilyItems( {
            files: manifest.session?.files,
            slugRoot: 'session',
            groupOrder: SESSION_GROUP_ORDER,
            groupLabels: SESSION_GROUP_LABELS
        } )

        return { specItems, workbenchItems, sessionItems, specVersion, workbenchVersion, sessionVersion }
    }


    static #versionOf( { value } ) {
        return typeof value === 'string' && value.length > 0 ? value : '0.0.0'
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


    // Generic per-family grouped sidebar (workbench, sop). Groups files by
    // sidebar_group, orders groups by groupOrder (unknown keys appended), and renders
    // each file under slugRoot/<slug>.
    static #buildFamilyItems( { files, slugRoot, groupOrder, groupLabels } ) {
        const list = Array.isArray( files ) ? files : []
        const sorted = [ ...list ].sort( ( a, b ) => a.order - b.order )

        const buckets = {}
        sorted.forEach( ( file ) => {
            const key = typeof file.sidebar_group === 'string' ? file.sidebar_group : 'introduction'
            if( !buckets[ key ] ) {
                buckets[ key ] = []
            }
            buckets[ key ].push( {
                label: file.title,
                slug: `${ slugRoot }/${ file.slug }`
            } )
        } )

        const orderedKeys = groupOrder.filter( ( key ) => buckets[ key ] )
        const extraKeys = Object
            .keys( buckets )
            .filter( ( key ) => !groupOrder.includes( key ) )
        const allKeys = [ ...orderedKeys, ...extraKeys ]

        return allKeys.map( ( key ) => {
            return {
                label: groupLabels[ key ] ?? key,
                collapsed: false,
                items: buckets[ key ]
            }
        } )
    }


    static #minimalSidebar() {
        return {
            specItems: [],
            workbenchItems: [],
            sessionItems: [],
            specVersion: '0.0.0',
            workbenchVersion: '0.0.0',
            sessionVersion: '0.0.0'
        }
    }
}


export { SidebarLoader }
