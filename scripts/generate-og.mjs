// generate-og.mjs — (personal-brand Memo 015 audit, Bug 9). Renders
// public/og-default.png, the site-wide default Open Graph / Twitter card image
// (1200x630), from an inline SVG. Re-run when the brand changes: `npm run generate-og`.
import sharp from 'sharp'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const __dirname = dirname( fileURLToPath( import.meta.url ) )
const OUT = join( __dirname, '..', 'public', 'og-default.png' )

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="glow" cx="20%" cy="24%" r="72%">
      <stop offset="0%" stop-color="#5ee0d6" stop-opacity="0.14"/>
      <stop offset="60%" stop-color="#5ee0d6" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="1200" height="630" fill="#0d1117"/>
  <rect width="1200" height="630" fill="url(#glow)"/>
  <g stroke="#5ee0d6" stroke-width="6" stroke-linejoin="round" stroke-linecap="round" fill="none">
    <path d="M96 210 h58 l16 16 v72 a4 4 0 0 1 -4 4 H96 a4 4 0 0 1 -4 -4 V214 a4 4 0 0 1 4 -4 Z"/>
    <path d="M154 210 v16 h16"/>
    <path d="M110 250 h40"/>
    <path d="M110 274 h28"/>
  </g>
  <text x="200" y="290" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="76" font-weight="700" fill="#f0f6fc">memo-init</text>
  <text x="98" y="400" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-size="34" fill="#f0f6fc">Memo-driven, agentic software engineering.</text>
  <text x="98" y="452" font-family="-apple-system, Segoe UI, Roboto, sans-serif" font-size="28" fill="#8b949e">Guardrails first. Open Source (MIT).</text>
  <text x="98" y="556" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="26" fill="#5ee0d6">memo-init.github.io</text>
</svg>`

const run = async () => {
    await sharp( Buffer.from( svg ) ).png().toFile( OUT )
    console.log( `[generate-og] wrote ${ OUT }` )
}

run()
    .catch( ( err ) => {
        console.error( `[generate-og] ERROR: ${ err.message }` )
        process.exit( 1 )
    } )
