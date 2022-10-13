import type { LinksFunction, MetaFunction } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react'
import stylesUrl from './styles/build.css'
import Layout from './components/layout'

export default function App() {
  return (
    <html
      // The mismatch between server and client for the `className` attribute is
      // expected when JS is enabled because the `className` will be set to `js`
      // before hydration happens (this needs to happen early to prevent a
      // "flicker" of non-JS styles)
      suppressHydrationWarning
      lang='en'
    >
      <head>
        <Meta />
        <Links />
        <script
          dangerouslySetInnerHTML={{
            __html: `document.documentElement.className='js'`,
          }}
        />
      </head>
      <body>
        <Layout>
          <Outlet />
        </Layout>
        <ScrollRestoration />
        <Scripts />
        <LiveReload />
      </body>
    </html>
  )
}

export const meta: MetaFunction = () => ({
  charset: `utf-8`,
  title: `Tomer Aberbach`,
  viewport: `width=device-width,initial-scale=1`,
})

export const links: LinksFunction = () => [
  { rel: `stylesheet`, href: stylesUrl },
]
