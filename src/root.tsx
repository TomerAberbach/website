import type { LinksFunction } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react'
import {
  entries,
  flatMap,
  join,
  map,
  pipe,
  rangeTo,
  reduce,
  toArray,
} from 'lfi'
import tailwindStylesPath from './styles/tailwind.css'
import fontsStylesPath from './styles/fonts.css'
import Layout from './components/layout.tsx'
import logoIcoPath from './logo.ico'
import { ErrorCrashView } from './components/error.tsx'
import { useRouteError } from './services/json.ts'
import logoSvgPath from '~/private/media/logo.svg'

const App = () => (
  <html
    // The mismatch between server and client for the `className` attribute is
    // expected when JS is enabled because the `className` will be set to `js`
    // before hydration happens (this needs to happen early to prevent a
    // "flicker" of non-JS styles).
    suppressHydrationWarning
    lang='en'
  >
    <head>
      <meta charSet='utf-8' />
      <meta name='viewport' content='width=device-width,initial-scale=1' />
      <Meta />
      <Links />
      <HeadInlineScript />
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

const HeadInlineScript = () => {
  const fonts = {
    'Kantumruy Pro': pipe(
      rangeTo(100, 700).step(100),
      flatMap(weight => [String(weight), `italic ${weight}`]),
      reduce(toArray()),
    ),
    dm: [``, `italic`, `bold`],
  }

  return (
    <script
      dangerouslySetInnerHTML={{
        __html:
          `document.documentElement.className='js';` +
          `Promise.all([${pipe(
            entries(fonts),
            flatMap(([fontFamily, styles]) =>
              map(style => `${style} 1rem ${fontFamily}`.trim(), styles),
            ),
            map(font => `document.fonts.load('${font}')`),
            join(`,`),
          )}]).then(()=>document.documentElement.className+=' fonts')`,
      }}
    />
  )
}

export const ErrorBoundary = () => <ErrorCrashView error={useRouteError()} />

export const links: LinksFunction = () => [
  { rel: `preload`, href: fontsStylesPath, as: `style` },
  { rel: `stylesheet`, href: fontsStylesPath },
  { rel: `stylesheet`, href: tailwindStylesPath },
  { rel: `icon`, href: logoIcoPath, sizes: `any` },
  { rel: `icon`, href: logoSvgPath, type: `image/svg+xml` },
]

export default App
