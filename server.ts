import { join } from 'node:path'
import compression from 'compression'
import express from 'express'
import morgan from 'morgan'
import redirectUrl from './src/services/redirect-url.server.ts'

console.log(`Starting server`)

const distPath = join(import.meta.dirname, `dist`)
const port = Number.parseInt(process.env.PORT ?? `3000`, 10)
express()
  .use(compression())
  .disable(`x-powered-by`)
  .use((req, res, next) => {
    const redirectResult = redirectUrl(
      new URL(req.originalUrl, `http://${req.headers.host ?? `localhost`}`)
        .href,
    )
    if (redirectResult) {
      res.redirect(redirectResult.status, redirectResult.url)
    } else {
      next()
    }
  })
  .use((req, res, next) => {
    if (req.path.endsWith(`/`) && req.path.length > 1) {
      const query = req.url.slice(req.path.length)
      const safepath = req.path.slice(0, -1).replaceAll(/\/+/gu, `/`)
      res.redirect(301, safepath + query)
    } else {
      next()
    }
  })
  .use(
    `/_astro`,
    express.static(join(distPath, `_astro`), {
      immutable: true,
      maxAge: `1y`,
      // Don't add trailing slashes.
      redirect: false,
    }),
  )
  .use(
    express.static(distPath, {
      maxAge: `1h`,
      extensions: [`html`],
      // Don't add trailing slashes.
      redirect: false,
    }),
  )
  .use((req, res) => {
    res.status(404).sendFile(join(distPath, `404.html`))
  })
  .use(morgan(`tiny`))
  .listen(port, () =>
    console.log(`Server is running on http://localhost:${port}`),
  )
