import { index, route } from '@react-router/dev/routes'
import type { RouteConfig } from '@react-router/dev/routes'

export default [
  index(`./routes/home.tsx`),
  route(`feed.json`, `./routes/feed.json.ts`),
  route(`rss.xml`, `./routes/rss.xml.ts`),
  route(`:postId.png`, `./routes/post.png.tsx`),
  route(`*`, `./routes/post.tsx`),
] satisfies RouteConfig
