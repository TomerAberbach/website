import type { LinksFunction } from '@remix-run/node'
import { Links, LiveReload, Meta, Outlet, Scripts } from '@remix-run/react'
import tailwindStylesPath from './styles/build/tailwind.css'
import fontsStylesPath from './styles/build/fonts.css'
import Layout from './components/layout.js'
import ScrollRestoration from './components/scroll-restoration.js'
import logoIcoPath from '~/private/images/logo.ico'
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
