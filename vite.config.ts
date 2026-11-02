import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import react from '@vitejs/plugin-react'
import { defineConfig, type Plugin } from 'vite'
import { VitePWA } from 'vite-plugin-pwa'

// Local-dev-only stand-in for functions/api/tfnsw/[[path]].ts. That file is
// a Cloudflare Pages Function and needs the Workers runtime (`wrangler
// pages dev`) to run locally - not available on this machine. This plugin
// does the exact same job (forward /api/tfnsw/<endpoint> to TfNSW with the
// server-side API key attached) as plain Node middleware inside Vite's own
// dev server, so `npm run dev` alone gets real data without Workers at all.
// Production deploys to Cloudflare still use the real Function.
function tfnswDevProxyPlugin(): Plugin {
  return {
    name: 'tfnsw-dev-proxy',
    configureServer(server) {
      let apiKey = ''
      try {
        const raw = readFileSync(join(import.meta.dirname, '.dev.vars'), 'utf-8')
        const match = raw.match(/^TFNSW_API_KEY=(.*)$/m)
        apiKey = match?.[1]?.trim() ?? ''
      } catch {
        // .dev.vars not present - real client calls will just fail with a
        // clear error until a key is added.
      }

      server.middlewares.use('/api/tfnsw', async (req, res) => {
        if (!apiKey) {
          res.statusCode = 500
          res.end(JSON.stringify({ error: 'TFNSW_API_KEY missing - add it to .dev.vars' }))
          return
        }

        const endpoint = (req.url ?? '').replace(/^\//, '').split('?')[0]
        const search = (req.url ?? '').split('?')[1] ?? ''
        const upstreamUrl = `https://api.transport.nsw.gov.au/v1/tp/${endpoint}?${search}`

        try {
          const upstream = await fetch(upstreamUrl, {
            headers: { Authorization: `apikey ${apiKey}`, Accept: 'application/json' },
          })
          res.statusCode = upstream.status
          res.setHeader('Content-Type', 'application/json')
          res.end(await upstream.text())
        } catch (err) {
          res.statusCode = 502
          res.end(JSON.stringify({ error: String(err) }))
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tfnswDevProxyPlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      manifest: {
        name: 'Sydney Transit',
        short_name: 'SydTransit',
        description: 'Real-time Sydney train, bus, ferry and light rail departures',
        theme_color: '#0f1115',
        background_color: '#0f1115',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,svg,png,ico}'],
      },
    }),
  ],
})
