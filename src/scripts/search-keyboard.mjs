// Search-Keyboard — PRD-009 (Memo 004 Kap 9)
// Exactly 5 shortcuts: ArrowUp / ArrowDown / Enter / "/" / Escape.
// Ported from flowmcp.github.io src/scripts/search-keyboard.mjs.
//
// Cross-scope close: FlowMCP dispatched window CustomEvent( 'flowmcp:close-all' )
// to MobileMenuToggle. memo-init's MobileMenuToggle.astro deliberately has NO
// such listener (the dependency was removed as FlowMCP-specific), so emitting it
// would be a dead event. Instead closeAll() clears the mobile-menu body attribute
// directly — the same cross-scope effect SearchCustom.astro's wireEscape() uses.

// Starlight renders the dialog as <dialog class="astro-…"> inside a <site-search>
// web component, with .pagefind-ui as a child (not on the dialog itself). These
// robust selectors match across Starlight markup variants.
const SEARCH_DIALOG_SELECTORS = [
    'dialog[data-starlight-search]',
    '.starlight-search-dialog',
    'dialog.pagefind-ui',
    'site-search dialog',
    'dialog:has(.pagefind-ui)'
]

const findSearchDialog = () => {
    const found = SEARCH_DIALOG_SELECTORS
        .map( ( sel ) => document.querySelector( sel ) )
        .find( ( el ) => el !== null )
    return found || null
}

const findSearchInput = () => {
    return document.querySelector( '.pagefind-ui__search-input' )
}

// Navigate over result ITEMS, not links. Pagefind renders several
// .pagefind-ui__result-link per result (title + sub-results), so a link-based
// setActive would toggle is-active on the same item multiple times and the
// highlight would never stick. One item = one navigable step.
const findResultItems = () => {
    const results = Array.from( document.querySelectorAll( '.pagefind-ui__result' ) )
    if( results.length > 0 ) { return results }
    // Empty-State (Cmd+K, nothing typed yet) shows suggestion links. They must be
    // selectable with ↑/↓ too — matches SearchCustom.astro's .search-empty-state__link.
    return Array.from( document.querySelectorAll( '.search-empty-state__link' ) )
}

const isTyping = ( event ) => {
    const target = event.target
    if( !target ) { return false }
    const tag = ( target.tagName || '' ).toLowerCase()
    if( tag === 'input' || tag === 'textarea' ) { return true }
    if( target.isContentEditable ) { return true }
    return false
}

const openSearch = () => {
    const dialog = findSearchDialog()
    if( dialog && typeof dialog.showModal === 'function' && !dialog.open ) {
        dialog.showModal()
    }
    setTimeout( () => {
        const input = findSearchInput()
        if( input ) { input.focus() }
    }, 30 )
}

const closeAll = () => {
    const dialog = findSearchDialog()
    if( dialog && dialog.open && typeof dialog.close === 'function' ) {
        dialog.close()
    }
    // Cross-scope: clear the mobile-menu state on <body> (no dead CustomEvent —
    // memo-init's MobileMenuToggle has no close-all listener).
    document.body.removeAttribute( 'data-mobile-menu-expanded' )
}

const focusSearchInput = () => {
    const input = findSearchInput()
    if( !input ) {
        openSearch()
        return
    }
    input.focus()
}

let activeIndex = -1

const setActive = ( items, index ) => {
    if( items.length === 0 ) { return }
    const next = ( ( index % items.length ) + items.length ) % items.length
    let activeId = ''
    items.forEach( ( item, i ) => {
        if( i === next ) {
            item.classList.add( 'is-active' )
            item.setAttribute( 'aria-selected', 'true' )
            // aria-activedescendant pattern — input keeps focus, active descendant
            // is referenced by ID. Do not call link.focus().
            if( item.id ) { activeId = item.id }
            if( typeof item.scrollIntoView === 'function' ) {
                item.scrollIntoView( { block: 'nearest' } )
            }
        } else {
            item.classList.remove( 'is-active' )
            item.removeAttribute( 'aria-selected' )
        }
    } )
    activeIndex = next

    // keep focus on the search input, update aria-activedescendant
    const input = findSearchInput()
    if( input ) {
        input.setAttribute( 'aria-activedescendant', activeId )
    }
}

const navigateResults = ( direction ) => {
    const items = findResultItems()
    if( items.length === 0 ) { return false }
    const start = activeIndex < 0 ? ( direction > 0 ? -1 : 0 ) : activeIndex
    setActive( items, start + direction )
    return true
}

const openActiveResult = () => {
    const items = findResultItems()
    if( items.length === 0 || activeIndex < 0 ) { return false }
    const item = items[ activeIndex ]
    if( !item ) { return false }
    // Empty-State suggestion is itself an <a>; Pagefind result holds the link as a child.
    const link = item.matches( 'a' ) ? item : item.querySelector( '.pagefind-ui__result-link' )
    if( !link ) { return false }
    link.click()
    return true
}

const handleKeydown = ( event ) => {
    // Esc — always (even while typing) cross-scope close
    if( event.key === 'Escape' ) {
        closeAll()
        return
    }

    // Cmd+K / Ctrl+K — deliberately NOT handled here. Starlight registers the
    // global shortcut itself — no double handler.

    // While typing: only dialog-internal navigation allowed
    if( isTyping( event ) ) {
        const dialog = findSearchDialog()
        const isInDialog = dialog && dialog.open && dialog.contains( event.target )
        if( !isInDialog ) { return }
    }

    // "/" — focus the search input (only when the user is not typing)
    if( event.key === '/' && !isTyping( event ) ) {
        event.preventDefault()
        focusSearchInput()
        return
    }

    // ↑ / ↓ / Enter — only when the search dialog is open
    const dialog = findSearchDialog()
    if( !dialog || !dialog.open ) { return }

    if( event.key === 'ArrowDown' ) {
        event.preventDefault()
        navigateResults( 1 )
        return
    }
    if( event.key === 'ArrowUp' ) {
        event.preventDefault()
        navigateResults( -1 )
        return
    }
    if( event.key === 'Enter' ) {
        const opened = openActiveResult()
        if( opened ) { event.preventDefault() }
        return
    }
}

const resetActiveOnTyping = () => {
    activeIndex = -1
}

let initialized = false

const init = () => {
    if( initialized ) { return }
    initialized = true
    document.addEventListener( 'keydown', handleKeydown )
    document.addEventListener( 'input', ( event ) => {
        const target = event.target
        if( target && target.classList && target.classList.contains( 'pagefind-ui__search-input' ) ) {
            resetActiveOnTyping()
        }
    } )
}

const reinit = () => {
    activeIndex = -1
    init()
}

document.addEventListener( 'DOMContentLoaded', init )
document.addEventListener( 'astro:page-load', reinit )

export { init }
