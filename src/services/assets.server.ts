import { basename, extname } from 'node:path'
import {
  concat,
  entries,
  filterMap,
  map,
  pipe,
  reduce,
  toGrouped,
  toMap,
  toObject,
} from 'lfi'
import { arrayIncludes } from 'ts-extras'
import fontsStylesPath from '~/styles/fonts.css?url'

// Astro resolves an image to its metadata rather than a URL, even when a URL
// is asked for.
const ASSET_PATH_TO_MODULES: Readonly<
  Record<string, { default: string | { src: string } }>
> = import.meta.glob(`/private/media/*`, { eager: true, query: `?url` })

const getUrl = (asset: string | { src: string }): string =>
  typeof asset === `string` ? asset : asset.src

const FONTS_STYLES_ASSET: [string, { default: string }] = [
  `fonts.css`,
  { default: fontsStylesPath },
]

export const ASSET_NAME_TO_URL: ReadonlyMap<string, string> = pipe(
  concat(
    entries(ASSET_PATH_TO_MODULES),
    // A stylesheet is imported directly, because a glob does not resolve it
    // to a URL in a production build.
    [FONTS_STYLES_ASSET],
  ),
  map(([path, module]) => [basename(path), getUrl(module.default)]),
  reduce(toMap()),
)

const VIDEO_TYPES = [`mp4`, `webm`] as const
type VideoUrls = Record<(typeof VIDEO_TYPES)[number], string | undefined>

export const VIDEO_NAME_TO_URL: ReadonlyMap<string, VideoUrls> = pipe(
  entries(ASSET_NAME_TO_URL),
  filterMap(([name, url]): [string, [keyof VideoUrls, string]] | null => {
    const ext = extname(name)
    const videoType = ext.slice(1)
    if (!arrayIncludes(VIDEO_TYPES, videoType)) {
      return null
    }

    return [basename(name, ext), [videoType, url]]
  }),
  reduce(
    toGrouped(
      toObject<keyof VideoUrls, string | undefined>(),
      toMap<string, VideoUrls>(),
    ),
  ),
)
