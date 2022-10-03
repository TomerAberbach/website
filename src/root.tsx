import type { LinksFunction, MetaFunction } from '@remix-run/node'
import {
  Links,
  LiveReload,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from '@remix-run/react'
import stylesUrl from '../styles/index.css'
import Layout from './components/layout'

export const meta: MetaFunction = () => ({
  charset: `utf-8`,
  title: `Tomer Aberbach`,
  viewport: `width=device-width,initial-scale=1`,
})

export const links: LinksFunction = () => [
  { rel: `stylesheet`, href: stylesUrl },
]

export default function App() {
  return (
    <html lang='en'>
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
