import htmlTags from 'html-tags'
import svgTagNames from 'svg-tag-names'
import voidHtmlTags from 'html-tags/void'

export const tags = new Set(htmlTags.concat(svgTagNames))

export const isTag = value => tags.has(value)

export const selfClosingTags = new Set(voidHtmlTags)

export const isSelfClosingTag = value => selfClosingTags.has(value)

export const nonSelfClosingTags = new Set(
  (function* () {
    for (const tag of tags) {
      if (!selfClosingTags.has(tag)) {
        yield tag
      }
    }
  })()
)

export const isNonSelfClosingTag = value => nonSelfClosingTags.has(value)
