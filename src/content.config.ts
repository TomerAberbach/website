import fs from 'node:fs/promises'
import { basename, join } from 'node:path'
import type { Loader } from 'astro/loaders'
import { z } from 'astro/zod'
import { defineCollection } from 'astro:content'
import matter from 'gray-matter'

const stringSetSchema = z
  .array(z.string())
  .refine(strings => new Set(strings).size === strings.length)
  .transform(strings => new Set(strings.sort()))

const basePostSchema = z.object({
  title: z.string(),
  tags: stringSetSchema,
  referencedBy: z
    .record(z.string(), z.string())
    .default({})
    .transform(references => new Map(Object.entries(references))),
  dates: z.object({
    published: z.coerce.date(),
    updated: z.coerce.date().optional(),
  }),
})

// Posts live outside `src` in `private/posts` and run through a bespoke unified
// pipeline (see `convert-markdown.ts`), so we use a custom loader rather
// than the built-in `glob()` one: it stores the raw frontmatter + body and
// skips Astro's markdown rendering (which would try to resolve the `$asset`
// placeholder image references the pipeline rewrites later). Underscore-prefixed
// files are treated as drafts and skipped.
const postsLoader = (directory: string): Loader => ({
  name: `posts-loader:${directory}`,
  load: async context => {
    const postsDirectory = join(process.cwd(), directory)
    const filenames = (await fs.readdir(postsDirectory)).filter(
      filename => filename.endsWith(`.md`) && !filename.startsWith(`_`),
    )

    context.store.clear()
    await Promise.all(
      filenames.map(async filename => {
        const id = basename(filename, `.md`)
        const raw = await fs.readFile(join(postsDirectory, filename), `utf8`)
        const { data: frontmatter, content: body } = matter(raw)
        const data = await context.parseData({ id, data: frontmatter })
        context.store.set({
          id,
          data,
          body,
          digest: context.generateDigest(raw),
        })
      }),
    )
  },
})

export const collections = {
  markdownPosts: defineCollection({
    loader: postsLoader(`private/posts/markdown`),
    schema: basePostSchema,
  }),
  hrefPosts: defineCollection({
    loader: postsLoader(`private/posts/href`),
    schema: basePostSchema.extend({
      href: z.string(),
      hrefs: stringSetSchema,
    }),
  }),
}
