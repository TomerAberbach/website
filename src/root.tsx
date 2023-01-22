/* eslint-disable camelcase */

import type { LinksFunction, V2_MetaFunction } from '@remix-run/node'
import { Links, LiveReload, Meta, Outlet, Scripts } from '@remix-run/react'
import tailwindStylesPath from './styles/build/tailwind.css'
import fontsStylesPath from './styles/build/fonts.css'
import Layout from './components/layout.js'
import ScrollRestoration from './components/scroll-restoration.js'

const App = () => (
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

export const meta: V2_MetaFunction = () => [
  { charSet: `utf-8` },
  { name: `viewport`, content: `width=device-width,initial-scale=1` },
]

export const links: LinksFunction = () => [
  { rel: `stylesheet`, href: fontsStylesPath },
  { rel: `stylesheet`, href: tailwindStylesPath },
]

export default App
