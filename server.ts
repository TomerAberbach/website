import { createRequestHandler } from '@react-router/express'
import compression from 'compression'
import express from 'express'
import morgan from 'morgan'
import type { ServerBuild } from 'react-router'

console.log(`Starting server`)

const port = Number.parseInt(process.env.PORT ?? `3000`, 10)
express()
  .use(compression())
  .disable(`x-powered-by`)
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
    `/assets`,
    express.static(`build/client/assets`, {
      immutable: true,
      maxAge: `1y`,
      // Don't add trailing slashes.
      redirect: false,
    }),
  )
  .use(
    express.static(`build/client`, {
      maxAge: `1h`,
      // Don't add trailing slashes.
      redirect: false,
    }),
  )
  .use(
    createRequestHandler({
      build: (await import(`./build/server/index.js` as string)) as ServerBuild,
    }),
  )
  .use(morgan(`tiny`))
  .listen(port, () =>
    console.log(`Server is running on http://localhost:${port}`),
  )
