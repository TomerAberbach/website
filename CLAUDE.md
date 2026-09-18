# Website

The portfolio website and blog at https://tomeraberba.ch, built with Astro as a
static site with React islands and deployed to Cloudflare Workers as static
assets.

## Project structure

```
website
├── private/
│   ├── posts/
│   │   ├── markdown/*.md    # Blog posts, with front matter for the metadata
│   │   └── href/*.md        # Posts that link elsewhere, front matter only
│   ├── media/               # Images and videos referenced by posts and pages
│   └── fonts/               # Font files and the fontconfig used to render thumbnails
├── public/
│   ├── _redirects           # Redirects from old URLs, in Cloudflare `_redirects` syntax
│   └── _headers             # Cache headers for the fingerprinted `_astro` files
├── src/
│   ├── pages/               # Astro pages and endpoints, one per route
│   ├── layouts/layout.astro # The document, head, header, and footer
│   ├── components/          # React islands and Astro components
│   ├── hooks/               # React hooks
│   ├── services/            # Server-side content pipeline and shared helpers
│   │   ├── post-keys.server.ts        # Lists the posts in `private/posts`
│   │   ├── post.server.ts             # Parses a post's front matter and content
│   │   ├── convert-markdown.server.ts # The remark and rehype pipeline
│   │   ├── ordered.server.ts          # Orders posts and links neighbors and references
│   │   ├── graph.server.ts            # Builds and lays out the post graph
│   │   ├── graph-facts.server.ts      # Computes the facts shown above the graph
│   │   ├── render-post.server.tsx     # Renders post HTML with custom elements
│   │   └── render-thumbnail.server.tsx # Renders a post's Open Graph image
│   ├── styles/              # Tailwind and font stylesheets
│   └── test/                # Test fixtures, helpers, and browser commands
├── scripts/build.ts         # Production build, including font subsetting
├── wrangler.jsonc           # Serves `dist` on Cloudflare Workers with its `_redirects` and `_headers`
└── types/                   # Ambient type declarations
```

## Commands

- `pnpm dev` runs the development server.
- `pnpm check` runs every check CI runs.
- `pnpm test:node --run <file>` runs a server-side test file.
  `pnpm test:browser --run <file>` runs a component test file in Chromium and
  WebKit.
- `pnpm build` produces the production build, which requires `fonttools`.
- `pnpm preview` serves the production build the way Cloudflare does.
- `pnpm deploy` deploys the production build. CI deploys every push to `main`.

## Testing

Tests are colocated with the code. Files ending in `.test.ts` run in the `node`
vitest project. Tests of pages start with `_` so Astro does not route them.
Files ending in `.browser.test.tsx` run in real browsers through vitest browser
mode, with Tailwind applied. Screenshot references are stored in
`__screenshots__` directories per platform. Only macOS references are committed,
so CI runs the browser tests on macOS.

The markdown pipeline renders mermaid diagrams in a browser and fetches embed
data over the network, so tests keep fixtures free of both unless the test is
about the real posts.

## Fonts

Thumbnails are rendered by sharp, whose pango uses CoreText on macOS and ignores
fontconfig. `PANGOCAIRO_BACKEND=fontconfig` and `FONTCONFIG_PATH=private/fonts`
make it use the fonts in `private/fonts`, as the production image does.
