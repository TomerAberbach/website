import htmlTags from 'html-tags'
import svgTagNames from 'svg-tag-names'
import voidHtmlTags from 'html-tags/void'

const createSetFunctions = set => ({
  get: () => new Set(set),
  is: value => set.has(value)
})

const tags = new Set(htmlTags.concat(svgTagNames))
export const { get: getTags, is: isTag } = createSetFunctions(tags)

const selfClosingTags = new Set(voidHtmlTags)
export const {
  get: getSelfClosingTags,
  is: isSelfClosingTag
} = createSetFunctions(selfClosingTags)

const nonSelfClosingTags = new Set(
  (function* () {
    for (const tag of tags) {
      if (!selfClosingTags.has(tag)) {
        yield tag
      }
    }
  })()
)
export const {
  get: getNonSelfClosingTags,
  is: isNonSelfClosingTag
} = createSetFunctions(nonSelfClosingTags)
