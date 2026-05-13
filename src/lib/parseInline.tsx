import type { ReactNode } from "react"

/**
 * Parses inline markup used in question text and options:
 *   __text__   → <u>text</u>   (underlined — used in English questions)
 *   ^{text}    → <sup>text</sup>  (superscript — used for SI units, exponents)
 *   _{text}    → <sub>text</sub>  (subscript — used for chemical formulas)
 */
export function parseInline(text: string): ReactNode[] {
  const re = /__([^_]+)__|_{([^}]*)}|\^{([^}]*)}/g
  const nodes: ReactNode[] = []
  let last = 0
  let key = 0

  for (const m of text.matchAll(re)) {
    if (m.index! > last) nodes.push(text.slice(last, m.index))

    if (m[1] !== undefined) {
      nodes.push(
        <u key={key++} className="underline underline-offset-2 decoration-2">
          {m[1]}
        </u>
      )
    } else if (m[2] !== undefined) {
      nodes.push(
        <sub key={key++} className="text-[0.72em]">
          {m[2]}
        </sub>
      )
    } else if (m[3] !== undefined) {
      nodes.push(
        <sup key={key++} className="text-[0.72em]">
          {m[3]}
        </sup>
      )
    }

    last = m.index! + m[0].length
  }

  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

export function InlineText({
  text,
  className,
}: {
  text: string
  className?: string
}) {
  return <span className={className}>{parseInline(text)}</span>
}
