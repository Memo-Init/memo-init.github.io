import { mkdir, writeFile } from 'node:fs/promises'

// generate-robots-txt.mjs — write public/robots.txt.
// Reduced port of the FlowMCP generator: memo-init publishes a single
// llms file, so the file list is an inline constant instead of refs.json.

const OUTPUT = 'public/robots.txt'
const SITE_BASE = 'https://memo-init.github.io'
const LLMS_FILES = [
    { path: '/llms.txt', label: 'Full spec:' }
]

const buildRobotsTxt = () => {
    const header = [
        'User-agent: *',
        'Allow: /',
        '',
        '# Sitemap',
        `Sitemap: ${ SITE_BASE }/sitemap-index.xml`
    ].join( '\n' )

    const llmsLines = [ '', '# llms.txt — machine-readable context' ]
    LLMS_FILES
        .forEach( ( file ) => {
            llmsLines.push( `# ${ file.label } ${ SITE_BASE }${ file.path }` )
        } )

    return `${ header }\n${ llmsLines.join( '\n' ) }\n`
}

const main = async () => {
    await mkdir( 'public', { recursive: true } )
    const body = buildRobotsTxt()
    await writeFile( OUTPUT, body, 'utf8' )
    console.log( `[generate-robots-txt] wrote ${ OUTPUT } (${ body.length } bytes)` )
}

main()
    .catch( ( error ) => {
        console.error( `[generate-robots-txt] ERROR: ${ error.message }` )
        process.exit( 1 )
    } )
