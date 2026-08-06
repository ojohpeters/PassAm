/**
 * Question formatting.
 *
 * A rendering-time repair layer for question banks that arrive in mixed and
 * damaged formats — mojibake, HTML <sup> tags, LaTeX, scraped MathJax debris,
 * bare unit exponents. Nothing here modifies stored data: every mode renders
 * through it, so a newly imported bank is readable immediately and the raw
 * import stays intact.
 *
 * Use RichText / renderRich for anything that came out of the questions,
 * options or explanations columns.
 */

export { RichText, renderRich, renderMarkup } from "./RichText"
export { normalizeText, type TextKind, type NormalizeOptions } from "./normalize"
export { fixMojibake } from "./mojibake"
export { renderLatex } from "./latex"
