import { defineCollection, z } from 'astro:content'
import { glob } from 'astro/loaders'
import { docsLoader } from '@astrojs/starlight/loaders'
import { docsSchema } from '@astrojs/starlight/schema'

const docs = defineCollection( {
    loader: docsLoader(),
    schema: docsSchema()
} )

// Blog collection — reduced FlowMCP pattern, English-only (no `lang` field,
// no DE mirror). docsSchema({extend}) merges the custom fields with the
// Starlight built-in schema so posts render via <StarlightPage>.
const blog = defineCollection( {
    loader: glob( { pattern: '**/*.{md,mdx}', base: './src/content/blog' } ),
    schema: docsSchema( {
        extend: z.object( {
            date: z.coerce.date(),
            author: z.string().default( 'Memo-Init Team' ),
            tags: z.array( z.string() ).default( [] ),
            cover: z.string().optional(),
            draft: z.boolean().default( false ),
            featured: z.boolean().optional()
        } )
    } )
} )

export const collections = { docs, blog }
