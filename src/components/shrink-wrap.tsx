import StyleObserver from '@bramus/style-observer'
import { createElement, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

const ShrinkWrap = ({
  as = `div`,
  children,
}: {
  as?: React.ElementType
  children?: ReactNode
}) => {
  const elementRef = useRef<HTMLDivElement>(null)
  const shrinkWrap = useCallback(() => {
    const element = elementRef.current!
    const { firstChild, lastChild, style } = element

    style.width = ``
    if (!firstChild || !lastChild) {
      return
    }

    const range = document.createRange()
    range.setStartBefore(firstChild)
    range.setEndAfter(lastChild)
    const { width } = range.getBoundingClientRect()

    style.width = `${width}px`
  }, [])

  // Recalculate shrink wrap on changes to text in the element.
  useEffect(() => {
    const observer = new MutationObserver(() => {
      observer.disconnect()
      try {
        shrinkWrap()
      } finally {
        observe()
      }
    })
    const observe = () =>
      observer.observe(elementRef.current!, {
        characterData: true,
        subtree: true,
      })
    observe()
    return () => observer.disconnect()
  }, [shrinkWrap])

  useEffect(() => {
    const element = elementRef.current!
    const observer = new StyleObserver(shrinkWrap, {
      properties: [
        `font-family`,
        `font-feature-settings`,
        `font-size`,
        `font-variation-settings`,
        `font-weight`,
        `line-height`,
        `text-wrap-mode`,
        `text-wrap-style`,
      ],
    })
    observer.observe(element)
    return () => observer.unobserve(element)
  }, [shrinkWrap])

  return createElement(
    as,
    {},
    <div ref={elementRef} style={{ boxSizing: `content-box` }}>
      {children}
    </div>,
  )
}

export default ShrinkWrap
