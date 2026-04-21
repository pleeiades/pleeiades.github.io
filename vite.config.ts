import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'arasaac_logo.png', 'icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'ALD Board Maker',
        short_name: 'ALD Boards',
        description: 'Create Assisted Language Device boards with ARASAAC pictograms — works offline.',
        theme_color: '#863bff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          {
            src: 'icon-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
          {
            src: 'icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
        runtimeCaching: [
          {
            // ARASAAC pictogram images via local proxy — never change for a given ID, cache aggressively.
            urlPattern: ({ url }: { url: URL }) => url.pathname.startsWith('/api/pictogram-proxy'),
            handler: 'CacheFirst',
            options: {
              cacheName: 'arasaac-images',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 60 * 60 * 24 * 90, // 90 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            // ARASAAC search API — serve from cache instantly, refresh in background.
            urlPattern: /^https:\/\/api\.arasaac\.org\/api\/pictograms\/.*/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'arasaac-api',
              expiration: {
                maxEntries: 200,
                maxAgeSeconds: 60 * 60 * 24 * 7, // 7 days
              },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  base: '/',
  server: {
    proxy: {
      '/api/pictogram-proxy': {
        target: 'https://static.arasaac.org',
        changeOrigin: true,
        rewrite: (path) => {
          const qs = path.split('?')[1] ?? '';
          const url = new URLSearchParams(qs).get('url') ?? '';
          if (url.startsWith('https://static.arasaac.org/')) {
            return new URL(url).pathname;
          }
          return path;
        },
      },
    },
  },
})
