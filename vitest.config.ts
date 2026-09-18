import tailwindcss from '@tailwindcss/vite'
import { playwright } from '@vitest/browser-playwright'
import { defineConfig } from 'vitest/config'
import { getGraph, renderThumbnail } from './src/test/commands.ts'

const BROWSER_TESTS = `src/**/*.browser.test.{ts,tsx}`

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [tailwindcss()],
  test: {
    coverage: {
      include: [`src`],
    },
    projects: [
      {
        test: {
          name: `node`,
          environment: `node`,
          // The markdown pipeline loads a syntax highlighter and renders
          // thumbnails at the highest compression effort.
          testTimeout: 30_000,
          include: [`src/**/*.test.{ts,tsx}`],
          exclude: [BROWSER_TESTS],
        },
      },
      {
        optimizeDeps: {
          include: [
            `react`,
            `react-dom`,
            `react/jsx-dev-runtime`,
            `superjson`,
            `vitest-browser-react`,
          ],
        },
        test: {
          name: `browser`,
          include: [BROWSER_TESTS],
          setupFiles: [`./src/test/browser-setup.ts`],
          browser: {
            enabled: true,
            headless: true,
            provider: playwright(),
            // Wide enough for a full size post thumbnail.
            viewport: { width: 1280, height: 720 },
            commands: { getGraph, renderThumbnail },
            instances: [
              { browser: `chromium` },
              {
                browser: `webkit`,
                include: [
                  `src/components/graph-widget.browser.test.tsx`,
                  `src/components/shrink-wrap.browser.test.tsx`,
                  `src/components/tags-filter-form.browser.test.tsx`,
                  `src/components/tooltip.browser.test.tsx`,
                ],
              },
            ],
          },
        },
      },
    ],
  },
})
