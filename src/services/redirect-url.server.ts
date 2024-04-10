import fs from 'node:fs/promises'
import { parseRedirectUrl } from 'redirect-url'
import { privatePath } from '~/services/path.server.ts'

const redirectUrl = parseRedirectUrl(
  await fs.readFile(privatePath(`redirects.txt`), `utf8`),
)

export default redirectUrl
