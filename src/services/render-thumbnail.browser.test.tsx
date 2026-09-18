import { expect, test } from 'vitest'
import { commands, page } from 'vitest/browser'
import { render } from 'vitest-browser-react'
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from './thumbnail-constants.ts'

// A published post with a title long enough to wrap.
const POST_ID = `avoid-layout-shifts-caused-by-web-fonts-with-postcss-fontpie`

// The real post runs through the whole markdown pipeline.
const REAL_POST_TIMEOUT_MS = 120_000

test(
  `the thumbnail of a real post matches the reference image`,
  { timeout: REAL_POST_TIMEOUT_MS },
  async () => {
    const image = await commands.renderThumbnail(POST_ID)
    await render(
      <img
        alt='Thumbnail'
        src={`data:image/png;base64,${image}`}
        width={THUMBNAIL_WIDTH}
        height={THUMBNAIL_HEIGHT}
      />,
    )

    await expect(
      page.getByRole(`img`, { name: `Thumbnail` }),
    ).toMatchScreenshot(`thumbnail`, {
      comparatorOptions: { allowedMismatchedPixelRatio: 0.005 },
    })
  },
)
