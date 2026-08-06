# Question formatting

A **render-time** repair layer for question banks that arrive in mixed or damaged
formats. Nothing here writes to the database: the raw import stays exactly as it
was stored, and every quiz mode renders through this instead. That means a bank
imported from another site is readable immediately, and a bad rule can never
corrupt data — it only changes what's drawn on screen.

## Using it

```tsx
import { RichText } from "@/lib/question-format"

<RichText text={question.text} />
<RichText text={opt.text} kind="option" />
<RichText text={question.explanation} kind="explanation" />
```

`kind="option"` matters: option text gets repairs that would be wrong elsewhere
(a leaked answer label, leading punctuation debris).

The older `parseInline` / `InlineText` from `@/lib/parseInline` still work — they
forward to this module, so existing call sites needed no changes.

## The pipeline

`normalizeText()` folds every input format into one canonical markup:

| markup       | meaning     |
| ------------ | ----------- |
| `^{...}`     | superscript |
| `_{...}`     | subscript   |
| `__text__`   | underline   |
| `\( ... \)`  | LaTeX       |

Then `renderMarkup()` turns that into elements. Ordering matters and is fixed:

1. **`mojibake.ts`** — undo UTF-8-read-as-Windows-1252 (`Ï€` → `π`, `â»Â¹` → `⁻¹`).
   Works by reversing the byte transformation rather than by lookup table, so it
   repairs sequences nobody has catalogued yet.
2. **LaTeX is lifted out** and replaced with placeholders, so no later rule can
   corrupt a formula. It is restored at the very end.
3. Invisible characters, HTML entities, literal `\n`, odd spaces.
4. **Scraped-MathJax debris** — duplicated fragments (`10−3−3 s−1−1`), repeated
   `∣∣∣` bars.
5. Symbols — `∘`/`º`/`30o` → `°`, `x` → `×` before a power of ten.
6. HTML `<sup>`/`<sub>` → canonical markup; unknown tags dropped.
7. Unicode super/subscripts → canonical markup.
8. **Bare exponents** — `cm3` → cm³, `Jkg-1K-1` → J kg⁻¹ K⁻¹, `6x2` → 6x².
9. Option-only repairs.

## Extending it for a new subject

Most new subjects need one of these four edits.

**A symbol renders as its command name** (e.g. you see `oplus` in the output) —
add it to `SYMBOLS` in `latex.tsx`.

**A unit isn't superscripting** (`mol3` stays flat) — add the atom to
`UNIT_ATOM` in `normalize.ts`. Atoms combine automatically, so adding `cd`
makes `cdm-3` work too. Order longest-first: `mol` must precede `m`.

**A new mojibake fragment** (some `â`-prefixed debris survives) — add it to
`ORPHAN_SPECS` in `mojibake.ts`. Only fragments whose middle byte was dropped
need this; everything else is handled generically.

**Chemistry subscripts** (`H2O` → H₂O) are deliberately *not* implemented.
The rule would have to distinguish a formula from algebra, and getting it wrong
turns `x2` into x₂. When Chemistry banks land, add a dedicated rule gated on a
formula pattern (element symbols only, e.g. `/\b(?:[A-Z][a-z]?\d*){2,}\b/`)
rather than loosening the algebraic rule.

## What is deliberately conservative

Over-formatting clean text is worse than leaving damaged text alone, so several
rules refuse ambiguous cases:

- **Unsigned exponents on single-letter units are skipped** unless the unit is
  one of `m g s L Ω`. Otherwise `N50` (fifty naira) becomes N⁵⁰ and `A4` becomes
  A⁴. Signed exponents (`N-1`, `gC-1`) are unambiguous and always applied.
- **Exponents are capped at two digits**, which is what stops `N4000`.
- **Algebraic exponents only fire when the text reads like algebra** (contains
  `=`, `+`, `√`, or a spaced dash) and never when a letter follows the digit —
  that's what protects `H2O` and `CO2`.
- **Flattened fraction recovery is opt-in.** An option reading `5 12` probably
  means 5/12, but an option that genuinely holds two numbers would be rewritten
  into something wrong. Pass `options={{ recoverFlattenedFractions: true }}`
  per call site if a specific bank needs it.

There is a regression list of clean strings that must survive untouched; when
adding a rule, check it against text like `N4000`, `H2O`, `Fig2`, `Test2`,
`Vitamin B12` and `1 hour 30 minutes`.

## Why not KaTeX

KaTeX plus its font files is roughly 280KB before anything renders, and would
need extra work to cache for offline PWA use. Most users are on mobile data.
`latex.tsx` covers the subset the banks actually use — fractions, roots,
matrices, super/subscripts, Greek, operators, named functions — using flexbox
and a border, costing nothing extra to ship. Anything unrecognised degrades to
its own text rather than disappearing.
