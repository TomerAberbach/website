import fs from 'fs/promises'
import { renderToStaticMarkup } from 'react-dom/server'
import sharp from 'sharp'
import { THUMBNAIL_HEIGHT, THUMBNAIL_WIDTH } from './thumbnail.js'
import type { MarkdownPost } from '~/services/posts/types.js'
import { publicPath } from '~/services/path.server.js'
import {
  formatDatesForDisplay,
  formatMinutesToRead,
} from '~/services/format.js'
import { cached } from '~/services/cache.server.js'
import { SITE_TITLE_AND_AUTHOR } from '~/services/meta.js'

export const renderThumbnail = async (
  post: Pick<MarkdownPost, `title` | `dates` | `minutesToRead`>,
) =>
  sharp(Buffer.from(renderToStaticMarkup(<Thumbnail post={post} />)))
    .png()
    .composite([
      {
        input: await getCroppedAvatarImage(),
        left: 1.5 * PADDING,
        top: THUMBNAIL_HEIGHT - 1.5 * PADDING - AVATAR_PICTURE_SIZE,
      },
    ])
    .toBuffer()

const Thumbnail = ({
  post,
}: {
  post: Pick<MarkdownPost, `title` | `dates` | `minutesToRead`>
}) => (
  <svg
    width={THUMBNAIL_WIDTH}
    height={THUMBNAIL_HEIGHT}
    xmlns='http://www.w3.org/2000/svg'
    fontFamily="'Kantumruy Pro'"
  >
    <rect
      width={THUMBNAIL_WIDTH}
      height={THUMBNAIL_HEIGHT}
      rx='0'
      ry='0'
      fill='#fff'
    />

    <path
      d={[
        `M${PADDING + SHADOW_OFFSET},${
          SHADOW_OFFSET + PADDING + BORDER_RADIUS
        }`,
        `q0,${-BORDER_RADIUS} ${BORDER_RADIUS},${-BORDER_RADIUS}`,
        `h${THUMBNAIL_WIDTH - 2 * (PADDING + BORDER_RADIUS)}`,
        `q${BORDER_RADIUS},0 ${BORDER_RADIUS},${BORDER_RADIUS}`,
        `v${THUMBNAIL_HEIGHT - 2 * PADDING - BORDER_RADIUS}`,
        `h${-(THUMBNAIL_WIDTH - 2 * PADDING)}`,
        `z`,
      ].join(``)}
      fill='hsl(201, 97%, 67%)'
    />
    <path
      d={[
        `M${PADDING},${PADDING + BORDER_RADIUS}`,
        `q0,${-BORDER_RADIUS} ${BORDER_RADIUS},${-BORDER_RADIUS}`,
        `h${THUMBNAIL_WIDTH - 2 * (PADDING + BORDER_RADIUS)}`,
        `q${BORDER_RADIUS},0 ${BORDER_RADIUS},${BORDER_RADIUS}`,
        `v${THUMBNAIL_HEIGHT - 2 * PADDING - BORDER_RADIUS}`,
        `h${-(THUMBNAIL_WIDTH - 2 * PADDING)}`,
        `z`,
      ].join(``)}
      stroke='hsl(201, 97%, 67%)'
      strokeWidth={3}
      fill='#fff'
    />

    <text y={PADDING + THUMBNAIL_HEIGHT / 3} dominantBaseline='middle'>
      <tspan x={1.5 * PADDING} fontSize={42} fontWeight={800}>
        {post.title}
      </tspan>
      <tspan x={1.5 * PADDING} dy={40} fontSize={24} fill='hsl(201, 5%, 49%)'>
        {formatDatesForDisplay(post.dates)}
        {` `}
        <tspan fontWeight={600}>·</tspan>
        {` `}
        {formatMinutesToRead(post.minutesToRead)}
      </tspan>
    </text>

    <circle
      r={AVATAR_PICTURE_SIZE / 2}
      cx={1.5 * PADDING + AVATAR_PICTURE_SIZE / 2}
      cy={
        THUMBNAIL_HEIGHT -
        1.5 * PADDING -
        AVATAR_PICTURE_SIZE +
        AVATAR_PICTURE_SIZE / 2
      }
      fill='none'
      stroke='hsl(201, 97%, 67%)'
      strokeWidth={6}
    />
    <text
      x={1.5 * PADDING + AVATAR_PICTURE_SIZE + 20}
      y={THUMBNAIL_HEIGHT - 1.5 * PADDING - AVATAR_PICTURE_SIZE / 2}
      dominantBaseline='middle'
      fontSize={24}
      fontWeight={500}
    >
      {SITE_TITLE_AND_AUTHOR}
    </text>
  </svg>
)

const getCroppedAvatarImage = cached(async () =>
  sharp(await fs.readFile(publicPath(`avatar.png`)))
    .resize(AVATAR_PICTURE_SIZE, AVATAR_PICTURE_SIZE)
    .composite([
      {
        input: Buffer.from(
          renderToStaticMarkup(
            <svg>
              <circle
                r={AVATAR_PICTURE_SIZE / 2}
                cx={AVATAR_PICTURE_SIZE / 2}
                cy={AVATAR_PICTURE_SIZE / 2}
              />
            </svg>,
          ),
        ),
        blend: `dest-in`,
      },
    ])
    .toBuffer(),
)

const PADDING = 60
const BORDER_RADIUS = 16
const SHADOW_OFFSET = 10
const AVATAR_PICTURE_SIZE = 100
