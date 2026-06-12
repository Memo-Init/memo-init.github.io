// Mermaid-Zoom — PRD-008 (Memo 004 Kap 5)
// Lightbox for rehype-mermaid inline-svg. No .mermaid wrapper: rehype-mermaid
// renders bare <svg id="mermaid-…">. Vanilla, no dependency.
// Ported verbatim from flowmcp.github.io src/scripts/mermaid-zoom.mjs.

const OVERLAY_ID = 'memo-init-mermaid-overlay'
const TARGET_SELECTOR = '.sl-markdown-content svg[id^="mermaid"]'

const ensureOverlay = () => {
    const existing = document.getElementById( OVERLAY_ID )
    if( existing ) { return existing }
    const overlay = document.createElement( 'div' )
    overlay.id = OVERLAY_ID
    overlay.className = 'mermaid-overlay'
    overlay.setAttribute( 'role', 'dialog' )
    overlay.setAttribute( 'aria-modal', 'true' )
    overlay.setAttribute( 'aria-label', 'Diagram fullscreen' )
    const stage = document.createElement( 'div' )
    stage.className = 'mermaid-overlay__stage'
    overlay.appendChild( stage )
    document.body.appendChild( overlay )
    return overlay
}

const openOverlay = ( svgEl ) => {
    const overlay = ensureOverlay()
    const stage = overlay.querySelector( '.mermaid-overlay__stage' )
    const clone = svgEl.cloneNode( true )
    // ID NICHT entfernen: rehype-mermaid bettet die Theme-Styles als
    // id-skopierte Regeln ein (`#mermaid-N .node rect { fill: … }`). Ohne die ID
    // greift keine Regel mehr und das SVG faellt auf SVG-Default fill:#000 zurueck
    // (schwarze Boxen). Das Duplikat-ID-Risiko ist unkritisch (Original liegt
    // unsichtbar hinter dem Overlay).
    clone.removeAttribute( 'style' )
    clone.style.width = '100%'
    clone.style.height = '100%'
    clone.style.maxWidth = 'none'
    clone.style.maxHeight = 'none'
    stage.innerHTML = ''
    stage.appendChild( clone )
    overlay.classList.add( 'is-open' )
}

const closeOverlay = () => {
    const overlay = document.getElementById( OVERLAY_ID )
    if( ! overlay ) { return }
    overlay.classList.remove( 'is-open' )
    const stage = overlay.querySelector( '.mermaid-overlay__stage' )
    if( stage ) { stage.innerHTML = '' }
}

let wired = false

const initMermaidZoom = () => {
    // Zoom-in cursor + a11y hint per diagram. Idempotent via dataset guard.
    const targets = document.querySelectorAll( TARGET_SELECTOR )
    targets.forEach( ( svg ) => {
        if( svg.dataset.mermaidZoom === 'true' ) { return }
        svg.dataset.mermaidZoom = 'true'
        svg.style.cursor = 'zoom-in'
    } )

    if( wired ) { return }
    wired = true

    // Delegated click — also catches diagrams rendered after astro:page-load.
    document.addEventListener( 'click', ( event ) => {
        const overlay = document.getElementById( OVERLAY_ID )
        if( overlay && overlay.classList.contains( 'is-open' ) && overlay.contains( event.target ) ) {
            closeOverlay()
            return
        }
        const svg = event.target.closest( TARGET_SELECTOR )
        if( svg ) { openOverlay( svg ) }
    } )

    document.addEventListener( 'keydown', ( event ) => {
        if( event.key === 'Escape' ) { closeOverlay() }
    } )
}

document.addEventListener( 'DOMContentLoaded', initMermaidZoom )
document.addEventListener( 'astro:page-load', initMermaidZoom )

export { initMermaidZoom }
