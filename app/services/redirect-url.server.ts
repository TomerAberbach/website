import fs from 'node:fs'
import { parseRedirectUrl } from 'redirect-url'
import { privatePath } from '~/services/path.server.ts'

const redirectUrl = parseRedirectUrl(
  fs.readFileSync(privatePath(`redirects.txt`), `utf8`),
)

export default redirectUrl
