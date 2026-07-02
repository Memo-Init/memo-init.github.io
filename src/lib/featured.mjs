// src/lib/featured.mjs
// Single source for the featured blog post — ported from flowmcp.github.io.
// Used by BlogIndexLayout.astro.

const selectFeatured = ( { posts } ) => {
    const flagged = posts
        .filter( ( post ) => post.data.featured === true )

    // Bug 8 fix (personal-brand Memo 015 audit finding #8): an explicit flag must
    // win. Exactly one flag -> that post, regardless of date. Multiple flags -> the
    // newest flagged (posts arrives sorted date-desc with a deterministic id
    // tiebreak, so flagged[0] is stable), plus a build-time warning to flag once.
    // Zero flags -> newest post.
    if( flagged.length > 1 ) {
        console.warn( `[featured] ${ flagged.length } posts are flagged featured; using the newest flagged one. Flag exactly one post.` )
    }

    const featured = flagged.length >= 1
        ? flagged[ 0 ]
        : posts[ 0 ]

    return { featured }
}

export { selectFeatured }
