import type { LinksFunction } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react'
import tailwindStylesPath from './styles/tailwind.css'
import fontsStylesPath from './styles/fonts.css'
import Layout from './components/layout.js'
import logoIcoPath from './logo.ico'
import logoSvgPath from '~/private/images/logo.svg'

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
      {process.env.NODE_ENV === `production` && (
        <script
          src='https://cdn.usefathom.com/script.js'
          data-spa='auto'
          data-site='RAOMNART'
          defer
        />
      )}
      <LiveReload />
    </body>
  </html>
)

export const links: LinksFunction = () => [
  { rel: `preload`, href: fontsStylesPath, as: `style` },
  { rel: `stylesheet`, href: fontsStylesPath },
  { rel: `stylesheet`, href: tailwindStylesPath },
  { rel: `icon`, href: logoIcoPath, sizes: `any` },
  { rel: `icon`, href: logoSvgPath, type: `image/svg+xml` },
]

export default App
