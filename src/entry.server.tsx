import { PassThrough } from 'stream'
import type { EntryContext } from '@remix-run/node'
import { Response } from '@remix-run/node'
import { RemixServer } from '@remix-run/react'
import { renderToPipeableStream } from 'react-dom/server'

const handleRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  remixContext: EntryContext,
) =>
  new Promise((resolve, reject) => {
    let didError = false

    const stream = renderToPipeableStream(
      <RemixServer context={remixContext} url={request.url} />,
      {
        onShellReady: () => {
          const body = new PassThrough()

          responseHeaders.set(`Content-Type`, `text/html`)

          resolve(
            new Response(body, {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            }),
          )

          stream.pipe(body)
        },
        onShellError: err => {
          reject(err)
        },
        onError: error => {
          didError = true

          console.error(error)
        },
      },
    )

    setTimeout(() => stream.abort(), ABORT_DELAY)
  })

const ABORT_DELAY = 5000

export default handleRequest
