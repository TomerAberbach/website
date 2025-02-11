import { basename, extname } from 'node:path'
import {
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

const ASSET_PATH_TO_URL: Readonly<Record<string, string>> = import.meta.glob(
  [`/private/media/*`, `/app/styles/fonts.css`],
  { eager: true, query: `?url`, import: `default` },
)

export const ASSET_NAME_TO_URL: ReadonlyMap<string, string> = pipe(
  entries(ASSET_PATH_TO_URL),
  map(([path, url]) => [basename(path), url]),
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
