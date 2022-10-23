import { RemixBrowser } from '@remix-run/react'
import { hydrateRoot } from 'react-dom/client'
import { hydrate } from 'react-dom'

// https://github.com/facebook/react/issues/24430#issuecomment-1162415060
if (process.env.NODE_ENV === `test`) {
  hydrate(<RemixBrowser />, document)
} else {
  hydrateRoot(document, <RemixBrowser />)
}
