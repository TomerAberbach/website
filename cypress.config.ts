import { defineConfig } from 'cypress'
import isCI from 'is-ci'

export default defineConfig({
  e2e: {
    setupNodeEvents: (on, config) => ({
      ...config,
      baseUrl: `http://localhost:3000`,
      viewportWidth: 1030,
      viewportHeight: 800,
      video: !isCI,
      screenshotOnRunFailure: !isCI,
    }),
  },
})
