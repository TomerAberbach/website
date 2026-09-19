import { join } from 'node:path'
import superjson from 'superjson'
import type { BrowserCommand } from 'vitest/node'
import type * as GraphModule from '~/services/graph.ts'
import type * as PostKeysModule from '~/services/post-keys.ts'
import type * as PostModule from '~/services/post.ts'
import type * as RenderThumbnailModule from '~/services/render-thumbnail.tsx'

/** Renders the thumbnail of the markdown post with the given id as base64 PNG. */
export const renderThumbnail: BrowserCommand<[postId: string]> = async (
  { project },
  postId,
) => {
  useProductionFonts()
  const [{ getPostKeys }, { getMarkdownPost }, { renderThumbnail }] =
    await Promise.all([
      project.import<typeof PostKeysModule>(servicePath(`post-keys.ts`)),
      project.import<typeof PostModule>(servicePath(`post.ts`)),
      project.import<typeof RenderThumbnailModule>(
        servicePath(`render-thumbnail.tsx`),
      ),
    ])

  const key = (await getPostKeys()).get(postId)
  if (key?.type !== `markdown`) {
    throw new Error(`Expected a markdown post with id ${postId}`)
  }

  const image = await renderThumbnail(await getMarkdownPost(key))
  return image.toString(`base64`)
}

/** Builds the graph of the real posts and returns it serialized with superjson. */
export const getGraph: BrowserCommand = async ({ project }) => {
  const { getGraph } = await project.import<typeof GraphModule>(
    servicePath(`graph.ts`),
  )
  return superjson.stringify(await getGraph())
}

// Pango uses CoreText on macOS by default, which ignores fontconfig, so the
// fontconfig backend is forced to render text with the fonts in `private`, as
// the production image does.
const useProductionFonts = (): void => {
  process.env.PANGOCAIRO_BACKEND ??= `fontconfig`
  process.env.FONTCONFIG_PATH ??= `private/fonts`
}

// Vite's module runner resolves an absolute path, while the `~` alias only
// applies to the modules it transforms.
const servicePath = (name: string): string =>
  join(import.meta.dirname, `..`, `services`, name)
