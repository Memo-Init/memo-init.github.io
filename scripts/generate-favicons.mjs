// Favicon pipeline (Memo 003, Kap 4 — ported from flowmcp.github.io).
// Generates favicon.ico (32), favicon-{16,32,48,192,512}.png,
// favicon.png (= 512), apple-touch-icon.png (180) from the square logo.
import sharp from 'sharp'
import { copyFileSync, existsSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'


const __dirname = dirname( fileURLToPath( import.meta.url ) )
const PUBLIC_DIR = join( __dirname, '..', 'public' )
const SOURCE = join( __dirname, '..', 'src', 'assets', 'logo-square.svg' )


const generate = async () => {
    if( !existsSync( SOURCE ) ) {
        throw new Error( `Source not found: ${SOURCE}` )
    }
    const sizes = [
        { name: 'favicon-16.png',       size: 16 },
        { name: 'favicon-32.png',       size: 32 },
        { name: 'favicon-48.png',       size: 48 },
        { name: 'favicon-192.png',      size: 192 },
        { name: 'favicon-512.png',      size: 512 },
        { name: 'apple-touch-icon.png', size: 180 },
    ]

    const tasks = sizes.map( async ( { name, size } ) => {
        const out = join( PUBLIC_DIR, name )
        await sharp( SOURCE, { density: 300 } ).resize( size, size ).png().toFile( out )
        return { name, size, out }
    } )

    const results = await Promise.all( tasks )

    // favicon.ico — modern browsers accept PNG-encoded .ico
    const ico32 = await sharp( SOURCE, { density: 300 } ).resize( 32, 32 ).png().toBuffer()
    writeFileSync( join( PUBLIC_DIR, 'favicon.ico' ), ico32 )

    // favicon.png — 512 as main file
    const main512 = results.find( ( r ) => r.size === 512 )
    copyFileSync( main512.out, join( PUBLIC_DIR, 'favicon.png' ) )

    console.log( 'Favicons generated:', results.map( ( r ) => r.name ).join( ', ' ) )
    return { status: true }
}


generate()
    .catch( ( err ) => {
        console.error( err )
        process.exit( 1 )
    } )
