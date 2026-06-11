// src/lib/featured.mjs
// Single source for the featured blog post — ported from flowmcp.github.io.
// Used by BlogIndexLayout.astro.

const selectFeatured = ( { posts } ) => {
    const flagged = posts
        .filter( ( post ) => post.data.featured === true )

    // Deliberate fallback (no silent default): if zero or multiple flags,
    // the newest post wins. posts is already sorted date-desc.
    const featured = flagged.length === 1
        ? flagged[ 0 ]
        : posts[ 0 ]

    return { featured }
}

export { selectFeatured }
