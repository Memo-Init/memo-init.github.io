// Sidebar loader for the memo-init documentation site.
// Reads src/data/manifest.json (synced from the spec repo by sync-spec.mjs) and
// produces the Starlight sidebar items for four sibling spec families:
//   - core specification (grouped by sidebar_group)
//   - workbench spec (own grouped sidebar + own version)
//   - session spec (own grouped sidebar + own version; absorbs the former SOP family, Memo 049)
//   - spec meta-family (the Meta-Specification: how specs are built, Memo 059)
// Robust by design — if the manifest is missing (fresh checkout, sync not yet run),
// a minimal sidebar is returned so the build never hard-fails on a cold start.

import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'


const __dirname = dirname( fileURLToPath( import.meta.url ) )
const MANIFEST_PATH = resolve( __dirname, 'manifest.json' )

// Memo 052 Kap 8: the per-family group labels + display order are NO LONGER hardcoded here.
// They are the single source on the spec level — the per-version spec-manifest.json — synced
// into src/data/spec-manifest.<family>.json by sync-spec.mjs. This dissolves the former
// "Lockstep with generate-manifest.mjs" duplication. The tiny parse rule is duplicated (not
// imported) — the schema is small and stable; the spec repo and this site share no dependency.
// A missing manifest degrades to empty meta (the family then renders id-as-label / appended
// order), so the build never hard-fails on a cold checkout before sync-spec has run.
const loadGroupMeta = ( { family } ) => {
    const manifestPath = resolve( __dirname, `spec-manifest.${ family }.json` )
    if( !existsSync( manifestPath ) ) {
        return { labels: {}, order: [], sort: {} }
    }
    try {
        const parsed = JSON.parse( readFileSync( manifestPath, 'utf8' ) )
        const groups = Array.isArray( parsed.groups )
            ? [ ...parsed.groups ].sort( ( a, b ) => ( a.order || 0 ) - ( b.order || 0 ) )
            : []
        const labels = {}
        const order = []
        const sort = {}
        groups.forEach( ( group ) => {
            labels[ group.id ] = group.label
            order.push( group.id )
            if( typeof group.sort === 'string' ) sort[ group.id ] = group.sort
        } )
        return { labels, order, sort }
    } catch {
        return { labels: {}, order: [], sort: {} }
    }
}


class SidebarLoader {
    static buildSidebar() {
        const manifest = SidebarLoader.#loadManifest()
        if( !manifest ) {
            return SidebarLoader.#minimalSidebar()
        }

        const specVersion = SidebarLoader.#versionOf( { value: manifest.spec_version } )
        const workbenchVersion = SidebarLoader.#versionOf( { value: manifest.workbench?.version } )
        const sessionVersion = SidebarLoader.#versionOf( { value: manifest.session?.version } )
        const specMetaVersion = SidebarLoader.#versionOf( { value: manifest.spec?.version } )

        const coreMeta = loadGroupMeta( { family: 'core' } )
        const workbenchMeta = loadGroupMeta( { family: 'workbench' } )
        const sessionMeta = loadGroupMeta( { family: 'session' } )
        const specMetaMeta = loadGroupMeta( { family: 'spec' } )

        const specItems = SidebarLoader.#buildSpecItems( {
            manifest,
            groupOrder: coreMeta.order,
            groupLabels: coreMeta.labels,
            groupSort: coreMeta.sort
        } )
        const workbenchItems = SidebarLoader.#buildFamilyItems( {
            files: manifest.workbench?.files,
            slugRoot: 'workbench',
            groupOrder: workbenchMeta.order,
            groupLabels: workbenchMeta.labels,
            groupSort: workbenchMeta.sort
        } )
        const sessionItems = SidebarLoader.#buildFamilyItems( {
            files: manifest.session?.files,
            slugRoot: 'session',
            groupOrder: sessionMeta.order,
            groupLabels: sessionMeta.labels,
            groupSort: sessionMeta.sort
        } )
        const specMetaItems = SidebarLoader.#buildFamilyItems( {
            files: manifest.spec?.files,
            // Manifest/data block key stays `spec`; the published route is /meta-spec/ (Memo 064 F5a).
            slugRoot: 'meta-spec',
            groupOrder: specMetaMeta.order,
            groupLabels: specMetaMeta.labels,
            groupSort: specMetaMeta.sort
        } )

        return { specItems, workbenchItems, sessionItems, specMetaItems, specVersion, workbenchVersion, sessionVersion, specMetaVersion }
    }


    static #versionOf( { value } ) {
        return typeof value === 'string' && value.length > 0 ? value : '0.0.0'
    }


    // Order a group's items. Default keeps the upstream by-chapter-number order (the file list is
    // pre-sorted by file.order). A group whose spec-manifest carries `sort: "alpha"` is re-sorted by
    // its display label in codepoint order — dotfiles first (e.g. `.browser/` before `context/`) — so
    // a folder index renders as one clean alphabetical list instead of following chapter numbers.
    static #orderItems( { items, sort } ) {
        if( sort !== 'alpha' ) return items
        return [ ...items ].sort( ( a, b ) => ( a.label < b.label ? -1 : ( a.label > b.label ? 1 : 0 ) ) )
    }


    static #loadManifest() {
        if( !existsSync( MANIFEST_PATH ) ) {
            return null
        }
        const raw = readFileSync( MANIFEST_PATH, 'utf8' )
        return JSON.parse( raw )
    }


    static #buildSpecItems( { manifest, groupOrder, groupLabels, groupSort = {} } ) {
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
                slug: `memo/${ file.slug }`
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
                // Subcategories collapse by default; Starlight still auto-expands the group that
                // contains the current page, so navigation opens only the active path (Memo 054 follow-up).
                collapsed: true,
                items: SidebarLoader.#orderItems( { items: buckets[ key ], sort: groupSort[ key ] } )
            }
        } )
    }


    // Generic per-family grouped sidebar (workbench, sop). Groups files by
    // sidebar_group, orders groups by groupOrder (unknown keys appended), and renders
    // each file under slugRoot/<slug>.
    static #buildFamilyItems( { files, slugRoot, groupOrder, groupLabels, groupSort = {} } ) {
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
                // Subcategories collapse by default; Starlight still auto-expands the group that
                // contains the current page, so navigation opens only the active path (Memo 054 follow-up).
                collapsed: true,
                items: SidebarLoader.#orderItems( { items: buckets[ key ], sort: groupSort[ key ] } )
            }
        } )
    }


    static #minimalSidebar() {
        return {
            specItems: [],
            workbenchItems: [],
            sessionItems: [],
            specMetaItems: [],
            specVersion: '0.0.0',
            workbenchVersion: '0.0.0',
            sessionVersion: '0.0.0',
            specMetaVersion: '0.0.0'
        }
    }
}


export { SidebarLoader }
