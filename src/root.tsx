import type { LinksFunction, MetaFunction } from '@remix-run/node'
import { Links, LiveReload, Meta, Outlet, Scripts } from '@remix-run/react'
import stylesUrl from './styles/build.css'
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

export const meta: MetaFunction = () => ({
  charset: `utf-8`,
  title: `Tomer Aberbach`,
  viewport: `width=device-width,initial-scale=1`,
})

export const links: LinksFunction = () => [
  { rel: `stylesheet`, href: stylesUrl },
  { rel: `preconnect`, href: `https://fonts.googleapis.com` },
  {
    rel: `preconnect`,
    href: `https://fonts.gstatic.com`,
    crossOrigin: `anonymous`,
  },
  {
    rel: `stylesheet`,
    href: `https://fonts.googleapis.com/css2?family=Kantumruy+Pro:ital,wght@0,100;0,200;0,300;0,400;0,500;0,600;0,700;1,100;1,200;1,300;1,400;1,500;1,600;1,700&display=swap`,
  },
]

export default App
