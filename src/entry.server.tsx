import { PassThrough } from 'node:stream'
import { createReadableStreamFromReadable } from '@react-router/node'
import { isbot } from 'isbot'
import { renderToPipeableStream } from 'react-dom/server'
import { redirect, ServerRouter } from 'react-router'
import type { EntryContext } from 'react-router'
import redirectUrl from './services/redirect-url.server.ts'

const handleRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
) => {
  const redirectResult = redirectUrl(request.url)
  if (redirectResult) {
    return redirect(redirectResult.url, redirectResult.status)
  }

  return (
    isBotRequest(request.headers.get(`user-agent`))
      ? handleBotRequest
      : handleBrowserRequest
  )(request, responseStatusCode, responseHeaders, reactRouterContext)
}

const isBotRequest = (userAgent: string | null): boolean =>
  Boolean(userAgent) && isbot(userAgent)

const handleBotRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
) =>
  new Promise((resolve, reject) => {
    let shellRendered = false
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={reactRouterContext} url={request.url} />,
      {
        onAllReady: () => {
          shellRendered = true
          const body = new PassThrough()
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set(`Content-Type`, `text/html`)

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          )

          pipe(body)
        },
        onShellError: (error: unknown) => {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(error)
        },
        onError: (error: unknown) => {
          responseStatusCode = 500
          // Log streaming rendering errors from inside the shell. Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error)
          }
        },
      },
    )

    // Automatically timeout the React renderer after 6 seconds, which ensures
    // React has enough time to flush down the rejected boundary contents.
    setTimeout(abort, streamTimeout + 1000)
  })

const handleBrowserRequest = (
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
) =>
  new Promise((resolve, reject) => {
    let shellRendered = false
    const { pipe, abort } = renderToPipeableStream(
      <ServerRouter context={reactRouterContext} url={request.url} />,
      {
        onShellReady: () => {
          shellRendered = true
          const body = new PassThrough()
          const stream = createReadableStreamFromReadable(body)

          responseHeaders.set(`Content-Type`, `text/html`)

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          )

          pipe(body)
        },
        onShellError: (error: unknown) => {
          // eslint-disable-next-line @typescript-eslint/prefer-promise-reject-errors
          reject(error)
        },
        onError: (error: unknown) => {
          responseStatusCode = 500
          // Log streaming rendering errors from inside the shell. Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error)
          }
        },
      },
    )

    // Automatically timeout the React renderer after 6 seconds, which ensures
    // React has enough time to flush down the rejected boundary contents.
    setTimeout(abort, streamTimeout + 1000)
  })

// Reject/cancel all pending promises after 5 seconds.
const streamTimeout = 5000

export default handleRequest
