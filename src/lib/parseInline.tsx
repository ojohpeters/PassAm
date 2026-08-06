import type { ReactNode } from "react"
import { renderRich, type TextKind } from "./question-format"

/**
 * Inline question markup.
 *
 * The parsing lives in ./question-format, which also repairs the mixed and
 * damaged formats the imported banks arrive in (mojibake, HTML <sup> tags,
 * LaTeX, bare unit exponents). These two wrappers are kept so every existing
 * call site picks that up without changing.
 *
 * New code can call RichText from "@/lib/question-format" directly, which
 * takes a `kind` so option-specific repairs can run.
 */

export function parseInline(text: string, kind: TextKind = "question"): ReactNode[] {
  return renderRich(text, kind)
}

export function InlineText({
  text,
  kind = "question",
  className,
}: {
  text: string | null | undefined
  kind?: TextKind
  className?: string
}) {
  return <span className={className}>{renderRich(text, kind)}</span>
}
