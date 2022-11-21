import { findBestMatch } from 'string-similarity'
import type { Post } from './posts.server.js'
import { getPosts } from './posts.server.js'

const didYouMean = async (postId: string): Promise<Post> => {
  const posts = await getPosts()
  const postIds = [...posts.keys()]
  const { bestMatchIndex } = findBestMatch(postId.toLowerCase(), postIds)
  return posts.get(postIds[bestMatchIndex]!)!
}

export default didYouMean
