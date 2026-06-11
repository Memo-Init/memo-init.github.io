import rss from '@astrojs/rss'
import { getCollection } from 'astro:content'

export async function GET( context ) {
    const posts = ( await getCollection( 'blog', ( { data } ) => !data.draft ) )
        .sort( ( a, b ) => b.data.date.valueOf() - a.data.date.valueOf() )

    return rss( {
        title: 'Memo-Init Blog',
        description: 'Updates and release notes for Memo-Init.',
        site: context.site ?? 'https://memo-init.github.io',
        items: posts.map( ( post ) => ( {
            title: post.data.title,
            description: post.data.description,
            pubDate: post.data.date,
            author: post.data.author,
            link: `/blog/${post.id}/`
        } ) ),
        customData: '<language>en-us</language>'
    } )
}
