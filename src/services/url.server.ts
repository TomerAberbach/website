const getUrlAtPath = (request: Request, path: string): string => {
  const url = new URL(path, request.url)

  if (url.protocol === `http:` && url.hostname !== `localhost`) {
    url.protocol = `https:`
  }

  return String(url)
}

export default getUrlAtPath
