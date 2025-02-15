import compression from 'compression'
import express from 'express'
import morgan from 'morgan'
import { createRequestHandler } from '@react-router/express'

console.log(`Starting server`)

const port = Number.parseInt(process.env.PORT ?? `3000`, 10)
express()
  .use(compression())
  .disable(`x-powered-by`)
  .use((req, res, next) => {
    if (req.path.slice(-1) === '/' && req.path.length > 1) {
      const query = req.url.slice(req.path.length)
      const safepath = req.path.slice(0, -1).replace(/\/+/g, '/')
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
      // @ts-expect-error Virtual module provided by React Router at build time.
      build: () => import('../build/server/index.js'),
    }),
  )
  .use(morgan(`tiny`))
  .listen(port, () =>
    console.log(`Server is running on http://localhost:${port}`),
  )
