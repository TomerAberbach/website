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
import type { LinksFunction } from 'react-router'
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from 'react-router'
import { ErrorCrashView } from './components/error.tsx'
import Layout from './components/layout.tsx'
import logoIcoPath from './logo.ico'
import { useRouteError } from './services/deserialize.ts'
import fontsStylesPath from './styles/fonts.css?url'
import tailwindStylesPath from './styles/tailwind.css?url'
import logoSvgPath from '~/private/media/logo.svg'

const App = () => (
  <html
    // Ignore the mismatch between server and client for the `className`
    // attribute because it's expected when JS is enabled. `className` may be
    // set to `fonts` before hydration happens (this needs to happen early to
    // prevent a "flicker").
    className={
      typeof document === `undefined` ? `` : document.documentElement.className
    }
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
        __html: `Promise.all([${pipe(
          entries(fonts),
          flatMap(([fontFamily, styles]) =>
            map(style => `${style} 1rem ${fontFamily}`.trim(), styles),
          ),
          map(font => `document.fonts.load('${font}')`),
          join(`,`),
        )}]).then(()=>document.documentElement.classList.add('fonts'))`,
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
