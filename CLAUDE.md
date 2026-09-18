# Website

The portfolio website and blog at https://tomeraberba.ch, built with React
Router in framework mode and deployed to Fly.io as a Docker image.

## Project structure

```
website
├── private/
│   ├── posts/
│   │   ├── markdown/*.md    # Blog posts, with front matter for the metadata
│   │   └── href/*.md        # Posts that link elsewhere, front matter only
│   ├── media/               # Images and videos referenced by posts and pages
│   ├── fonts/               # Font files and the fontconfig used to render thumbnails
│   └── redirects.txt        # Redirects from old URLs
├── src/
│   ├── routes.ts            # Route configuration
│   ├── routes/              # One module per route, with its loader and meta
│   ├── components/          # React components
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
├── server.ts                # The Express server that serves the build
└── types/                   # Ambient type declarations
```

## Commands

- `pnpm dev` runs the development server.
- `pnpm check` runs every check CI runs.
- `pnpm test:node --run <file>` runs a server-side test file.
  `pnpm test:browser --run <file>` runs a component test file in Chromium and
  WebKit.
- `pnpm build` produces the production build, which requires `fonttools`.

## Testing

Tests are colocated with the code. Files ending in `.test.ts` run in the `node`
vitest project. Files ending in `.browser.test.tsx` run in real browsers through
vitest browser mode, with Tailwind applied. Screenshot references are stored in
`__screenshots__` directories per platform. Only macOS references are committed,
so CI runs the browser tests on macOS.

The markdown pipeline renders mermaid diagrams in a browser and fetches embed
data over the network, so tests keep fixtures free of both unless the test is
about the real posts.

## Fonts

Thumbnails are rendered by sharp, whose pango uses CoreText on macOS and ignores
fontconfig. `PANGOCAIRO_BACKEND=fontconfig` and `FONTCONFIG_PATH=private/fonts`
make it use the fonts in `private/fonts`, as the production image does.
