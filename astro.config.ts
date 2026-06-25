import { fileURLToPath } from 'node:url'
import preact from '@astrojs/preact'
import sitemap from '@astrojs/sitemap'
import { defineConfig } from 'astro/config'

const srcPath = fileURLToPath(new URL(`src`, import.meta.url))
const privatePath = fileURLToPath(new URL(`private`, import.meta.url))

export default defineConfig({
  site: `https://tomeraberba.ch`,
  output: `static`,
  // Emit `/id.html` served at `/id` (no trailing slash) to match the current
  // URLs, feeds, `/id.png`, and the redirect rules.
  trailingSlash: `never`,
  build: { format: `file` },
  integrations: [
    preact({ compat: true }),
    sitemap({
      // Only include HTML pages in the sitemap, not feeds or OG images.
      filter: page =>
        !/\.(?:png|json|xml)$/u.test(new URL(page).pathname) &&
        !new URL(page).pathname.startsWith(`/rss`),
    }),
  ],
  vite: {
    // Tailwind is processed via `@tailwindcss/postcss` (see `postcss.config.js`)
    // rather than `@tailwindcss/vite`, which is incompatible with Astro's
    // rolldown-based Vite.
    resolve: {
      // Explicit Vite aliases are required; tsconfig paths alone don't drive
      // Astro's Vite resolution. `~/private` must come before `~`.
      alias: [
        { find: `~/private`, replacement: privatePath },
        { find: `~`, replacement: srcPath },
      ],
    },
  },
})
