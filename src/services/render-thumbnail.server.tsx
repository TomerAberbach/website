/* eslint-disable id-length */

import fs from 'node:fs/promises'
import { ColorTranslator } from 'colortranslator'
import { htmlEscape } from 'escape-goat'
import { renderToStaticMarkup } from 'react-dom/server'
import type { Sharp } from 'sharp'
import sharp from 'sharp'
import { cache } from './cache.server.ts'
import type { MarkdownPost } from './post.server.ts'
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from './thumbnail-constants.ts'
import type { Dates } from '~/services/format.ts'
import {
  formatDatesForDisplay,
  formatMinutesToRead,
} from '~/services/format.ts'
import { SITE_TITLE_AND_AUTHOR } from '~/services/meta.ts'
import { privatePath } from '~/services/path.server.ts'

const blue400 = new ColorTranslator(`hsl(201, 97%, 67%)`).HEX
const gray600 = new ColorTranslator(`hsl(201, 5%, 39%)`).HEX

export const renderThumbnail = async (post: MarkdownPost) => {
  const [logo, thumbnailContent] = await Promise.all([
    getLogo(),
    renderThumbnailContent(post),
  ])
  return sharp(Buffer.from(renderToStaticMarkup(<ThumbnailFrame />)))
    .png()
    .composite([
      {
        left: CONTENT_BOX_RIGHT - LOGO_WIDTH,
        top: PADDING_BOX_BOTTOM - logo.info.height,
        input: logo.data,
      },
      {
        left: CONTENT_BOX_LEFT,
        top: CONTENT_BOX_TOP,
        input: thumbnailContent,
      },
    ])
    .png({ compressionLevel: 9, effort: 10 })
    .toBuffer()
}

const ThumbnailFrame = () => (
  <svg width={THUMBNAIL_WIDTH} height={THUMBNAIL_HEIGHT}>
    <rect
      width={THUMBNAIL_WIDTH}
      height={THUMBNAIL_HEIGHT}
      rx='0'
      ry='0'
      fill='#fff'
    />
    <path
      d={[
        `M${MARGIN + SHADOW_OFFSET},${MARGIN + SHADOW_OFFSET + BORDER_RADIUS}`,
        `q0,${-BORDER_RADIUS} ${BORDER_RADIUS},${-BORDER_RADIUS}`,
        `h${PADDING_BOX_WIDTH - 2 * BORDER_RADIUS}`,
        `q${BORDER_RADIUS},0 ${BORDER_RADIUS},${BORDER_RADIUS}`,
        `v${PADDING_BOX_HEIGHT - BORDER_RADIUS}`,
        `h${-PADDING_BOX_WIDTH}`,
        `z`,
      ].join(``)}
      fill={blue400}
    />
    <path
      d={[
        `M${MARGIN},${MARGIN + BORDER_RADIUS}`,
        `q0,${-BORDER_RADIUS} ${BORDER_RADIUS},${-BORDER_RADIUS}`,
        `h${PADDING_BOX_WIDTH - 2 * BORDER_RADIUS}`,
        `q${BORDER_RADIUS},0 ${BORDER_RADIUS},${BORDER_RADIUS}`,
        `v${PADDING_BOX_HEIGHT - BORDER_RADIUS}`,
        `h${-PADDING_BOX_WIDTH}`,
        `z`,
      ].join(``)}
      stroke={blue400}
      strokeWidth={3}
      fill='#fff'
    />
  </svg>
)

const renderThumbnailContent = async (post: MarkdownPost) => {
  const [header, avatarAndAuthorText] = await Promise.all([
    renderHeader(post),
    getAvatarAndAuthorText(),
  ])
  const baseThumbnailContent = await renderPng(
    sharp({
      create: {
        width: CONTENT_BOX_WIDTH,
        height: header.info.height + PADDING + AVATAR_SIZE,
        background: { r: 255, b: 255, g: 255, alpha: 0 },
        channels: 4,
      },
    }).composite([
      { left: 0, top: 0, input: header.data },
      {
        left: 0,
        top: header.info.height + PADDING,
        input: avatarAndAuthorText,
      },
    ]),
  )
  return renderPng(
    sharp(baseThumbnailContent).resize({
      width: CONTENT_BOX_WIDTH,
      height: CONTENT_BOX_HEIGHT,
      fit: `contain`,
      position: `left`,
      background: { r: 255, g: 255, b: 255, alpha: 0 },
    }),
  )
}

const renderHeader = async (
  post: Pick<MarkdownPost, `title` | `dates` | `minutesToRead`>,
) => {
  const [title, subtitle] = await Promise.all([
    renderTitle(post.title),
    renderSubtitle(post.dates, post.minutesToRead),
  ])
  return renderPngWithInfo(
    sharp({
      create: {
        width: CONTENT_BOX_WIDTH,
        height: title.info.height + SPACING + subtitle.info.height,
        background: { r: 255, b: 255, g: 255, alpha: 0 },
        channels: 4,
      },
    }).composite([
      { left: 0, top: 0, input: title.data },
      {
        left: 0,
        top: title.info.height + SPACING,
        input: subtitle.data,
      },
    ]),
  )
}

const renderTitle = (title: string) =>
  renderText(pango`<span line_height="0.9" weight="800">${title}</span>`, {
    width: CONTENT_BOX_WIDTH,
    height: MAX_TITLE_HEIGHT,
  })

const renderSubtitle = (dates: Dates, minutesToRead: number) => {
  const datesDisplay = formatDatesForDisplay(dates)
  const minutesToReadDisplay = formatMinutesToRead(minutesToRead)
  return renderText(
    pango`<span foreground="${gray600}" line_height="0.8">${datesDisplay} <span weight="600">·</span> ${minutesToReadDisplay}</span>`,
    { width: CONTENT_BOX_WIDTH, height: MAX_SUBTITLE_HEIGHT },
  )
}

const getLogo = cache(async () =>
  renderPngWithInfo(
    sharp(await fs.readFile(privatePath(`media/logo.svg`))).resize({
      width: LOGO_WIDTH,
    }),
  ),
)

const getAvatarAndAuthorText = cache(async () => {
  const authorText = await renderText(
    pango`<span line_height="0.8" weight="500">${SITE_TITLE_AND_AUTHOR}</span>`,
    {
      width: CONTENT_BOX_WIDTH - AVATAR_SIZE - SPACING,
      height: AVATAR_SIZE / 5,
    },
  )

  return sharp({
    create: {
      width: CONTENT_BOX_WIDTH,
      height: AVATAR_SIZE,
      background: { r: 255, b: 255, g: 255, alpha: 0 },
      channels: 4,
    },
  })
    .composite([
      {
        left: 0,
        top: 0,
        input: await renderPng(
          sharp(await fs.readFile(privatePath(`media/avatar.png`)))
            .resize({ width: AVATAR_SIZE, height: AVATAR_SIZE })
            .composite([
              // Make the avatar rounded.
              {
                input: Buffer.from(
                  renderToStaticMarkup(
                    <svg>
                      <circle
                        r={AVATAR_SIZE / 2}
                        cx={AVATAR_SIZE / 2}
                        cy={AVATAR_SIZE / 2}
                      />
                    </svg>,
                  ),
                ),
                blend: `dest-in`,
              },
              // Surround the rounded avatar with a blue border.
              {
                input: Buffer.from(
                  renderToStaticMarkup(
                    <svg>
                      <circle
                        r={(AVATAR_SIZE - 4) / 2}
                        cx={AVATAR_SIZE / 2}
                        cy={AVATAR_SIZE / 2}
                        fill='none'
                        stroke={blue400}
                        strokeWidth={4}
                      />
                    </svg>,
                  ),
                ),
              },
            ]),
        ),
      },
      // Place the author text to the right of the avatar.
      {
        left: AVATAR_SIZE + SPACING,
        top: 0,
        input: await renderPng(
          sharp(authorText.data)
            // Vertically center the author text with respect to the avatar.
            .resize({
              width: authorText.info.width,
              height: AVATAR_SIZE,
              fit: `contain`,
              background: { r: 255, b: 255, g: 255, alpha: 0 },
            }),
        ),
      },
    ])
    .png()
    .toBuffer()
})

const pango = (strings: TemplateStringsArray, ...values: unknown[]) => {
  let string = strings[0]!
  for (const [index, value] of values.entries()) {
    string += htmlEscape(String(value)) + strings[index + 1]!
  }
  return string
}

const renderText = async (
  text: string,
  { width, height }: { width: number; height: number },
) =>
  renderPngWithInfo(
    sharp({
      text: {
        font: `Kantumruy Pro`,
        text,
        width: Math.ceil(width),
        height: Math.ceil(height),
        rgba: true,
      },
    }),
  )

const renderPng = (sharp: Sharp) => sharp.png().toBuffer()

const renderPngWithInfo = (sharp: Sharp) =>
  sharp.png().toBuffer({ resolveWithObject: true })

const MARGIN = 60
const PADDING = (2 * MARGIN) / 3
const SPACING = MARGIN / 3

const PADDING_BOX_LEFT = MARGIN
const PADDING_BOX_TOP = MARGIN
const PADDING_BOX_RIGHT = THUMBNAIL_WIDTH - MARGIN
const PADDING_BOX_BOTTOM = THUMBNAIL_HEIGHT - MARGIN

const PADDING_BOX_WIDTH = PADDING_BOX_RIGHT - PADDING_BOX_LEFT
const PADDING_BOX_HEIGHT = PADDING_BOX_BOTTOM - PADDING_BOX_TOP

const CONTENT_BOX_LEFT = PADDING_BOX_LEFT + PADDING
const CONTENT_BOX_TOP = PADDING_BOX_TOP + PADDING
const CONTENT_BOX_RIGHT = PADDING_BOX_RIGHT - PADDING
const CONTENT_BOX_BOTTOM = PADDING_BOX_BOTTOM - PADDING

const CONTENT_BOX_WIDTH = CONTENT_BOX_RIGHT - CONTENT_BOX_LEFT
const CONTENT_BOX_HEIGHT = CONTENT_BOX_BOTTOM - CONTENT_BOX_TOP

const MAX_TITLE_HEIGHT = CONTENT_BOX_HEIGHT / 2
const MAX_SUBTITLE_HEIGHT = CONTENT_BOX_HEIGHT / 12

const AVATAR_SIZE = Math.round(CONTENT_BOX_HEIGHT / 3)
const LOGO_WIDTH = CONTENT_BOX_HEIGHT / 2

const BORDER_RADIUS = 16
const SHADOW_OFFSET = 10
