import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import { SITE_URL } from './src/services/site-url.ts'

export default defineConfig({
  site: SITE_URL,
  trailingSlash: `never`,
  build: { format: `file` },
  server: { port: 3000 },
  // Pages are fetched on hover so that navigating to them feels instant.
  prefetch: { prefetchAll: true, defaultStrategy: `hover` },
  integrations: [react()],
  vite: {
    resolve: { tsconfigPaths: true },
    plugins: [tailwindcss()],
  },
})
