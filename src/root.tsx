import type { LinksFunction } from '@remix-run/node'
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
      <meta charSet='utf-8' />
      <meta name='viewport' content='width=device-width,initial-scale=1' />
      <Meta />
      <link
        suppressHydrationWarning
        rel='preload'
        href={fontsStylesPath}
        as='style'
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `document.currentScript.previousElementSibling.setAttribute('onload','this.onload=null;this.rel="stylesheet"')`,
        }}
      />
      <noscript>
        <link rel='stylesheet' href={fontsStylesPath} />
      </noscript>
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

export const links: LinksFunction = () => [
  { rel: `stylesheet`, href: tailwindStylesPath },
  { rel: `icon`, href: `/favicon.ico`, sizes: `any` },
  { rel: `icon`, href: `/favicon.svg`, type: `image/svg+xml` },
]

export default App
