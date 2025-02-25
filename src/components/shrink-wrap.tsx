import { createElement, useCallback, useEffect, useRef } from 'react'
import type { ReactNode } from 'react'
import StyleObserver from '@bramus/style-observer'

const ShrinkWrap = ({
  as = `div`,
  ssr,
  nonce,
  children,
}: {
  as?: React.ElementType
  ssr?: boolean
  nonce?: string
  children?: ReactNode
}) => {
  if (!ssr && nonce) {
    throw new Error(`Cannot specify \`nonce\` without \`ssr\``)
  }

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
    <div
      suppressHydrationWarning={ssr}
      ref={elementRef}
      style={{ boxSizing: `content-box` }}
    >
      {children}
    </div>,
    ssr && (
      <script nonce={nonce}>
        {[
          `let e=document.currentScript.previousSibling;`,
          `let f=e.firstChild;`,
          `let l=e.lastChild;`,
          `if(f&&l){`,
          `let r=document.createRange();`,
          `r.setStartBefore(f);`,
          `r.setEndAfter(l);`,
          `e.style.width=\`\${r.getBoundingClientRect().width}px\`;`,
          `}`,
        ].join(``)}
      </script>
    ),
  )
}

export default ShrinkWrap
