/**
 * Mojibake repair.
 *
 * Questions imported from the legacy site were UTF-8 bytes decoded as
 * Windows-1252, then re-saved as UTF-8. The damage is baked into the stored
 * text, so we undo it at render time:
 *
 *   "Ï€"   → "π"      (CF 80 read as Ï + €)
 *   "Â°"    → "°"      (C2 B0 read as Â + °)
 *   "âˆ’"   → "−"      (E2 88 92)
 *   "Ã—"    → "×"      (C3 97)
 *
 * Rather than a hand-written lookup table (which would miss anything we
 * haven't seen yet), we reverse the exact transformation: map each character
 * back to the CP1252 byte it came from and decode those bytes as UTF-8.
 * Anything that doesn't decode cleanly is left untouched, so clean text and
 * genuine accented characters pass through unharmed.
 */

/** CP1252 assigns these characters to bytes 0x80–0x9F. */
const CP1252_HIGH: Record<string, number> = {
  "€": 0x80, "‚": 0x82, "ƒ": 0x83, "„": 0x84,
  "…": 0x85, "†": 0x86, "‡": 0x87, "ˆ": 0x88,
  "‰": 0x89, "Š": 0x8a, "‹": 0x8b, "Œ": 0x8c,
  "Ž": 0x8e, "‘": 0x91, "’": 0x92, "“": 0x93,
  "”": 0x94, "•": 0x95, "–": 0x96, "—": 0x97,
  "˜": 0x98, "™": 0x99, "š": 0x9a, "›": 0x9b,
  "œ": 0x9c, "ž": 0x9e, "Ÿ": 0x9f,
}

/** The byte a character would have been, or null if it can't be one. */
function toByte(ch: string): number | null {
  const code = ch.charCodeAt(0)
  if (code <= 0xff) return code
  const high = CP1252_HIGH[ch]
  return high === undefined ? null : high
}

/** Decode a UTF-8 byte sequence, rejecting overlong and out-of-range forms. */
function decodeUtf8(bytes: number[]): string | null {
  const len = bytes.length
  let cp: number

  if (len === 2) cp = ((bytes[0] & 0x1f) << 6) | (bytes[1] & 0x3f)
  else if (len === 3) cp = ((bytes[0] & 0x0f) << 12) | ((bytes[1] & 0x3f) << 6) | (bytes[2] & 0x3f)
  else if (len === 4) cp = ((bytes[0] & 0x07) << 18) | ((bytes[1] & 0x3f) << 12) | ((bytes[2] & 0x3f) << 6) | (bytes[3] & 0x3f)
  else return null

  // Overlong encodings, surrogates and out-of-range code points mean we
  // guessed wrong — bail so the original text survives.
  if (len === 2 && cp < 0x80) return null
  if (len === 3 && cp < 0x800) return null
  if (len === 4 && cp < 0x10000) return null
  if (cp >= 0xd800 && cp <= 0xdfff) return null
  if (cp > 0x10ffff) return null

  return String.fromCodePoint(cp)
}

/** How many continuation bytes a UTF-8 lead byte expects (0 if not a lead). */
function continuationCount(lead: number): number {
  if (lead >= 0xc2 && lead <= 0xdf) return 1
  if (lead >= 0xe0 && lead <= 0xef) return 2
  if (lead >= 0xf0 && lead <= 0xf4) return 3
  return 0
}

/** Does this text look like it contains mojibake at all? */
const SUSPECT = /[Â-ô][-¿€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/

/** Every character that could stand in for a UTF-8 continuation byte. */
const CONTINUATION = "\\u0080-\\u00BF" + Object.keys(CP1252_HIGH)
  .map((c) => "\\u" + c.charCodeAt(0).toString(16).toUpperCase().padStart(4, "0"))
  .join("")

/**
 * Bytes 0x81, 0x8D, 0x8F, 0x90 and 0x9D are undefined in CP1252 and are often
 * dropped entirely by the tools that mangled this text — leaving a sequence
 * one byte short that the decoder above can't rescue. Every affected
 * character in exam content is a super/subscript or a Greek letter, and each
 * remaining fragment maps to exactly one character, so we can finish the job
 * by hand.
 *
 *   "â»"  is U+207B ⁻ that lost its 0x81 byte
 *   "â‚"  is U+2081 ₁ that lost its 0x81 byte
 *
 * These run BEFORE the byte decoder, each guarded by a lookahead so we only
 * claim a fragment that genuinely cannot continue into a valid sequence.
 * Without the guard, repairing "â»" first would strand the "Â¹"
 * after it; without running them first, the decoder would fuse the repaired
 * ¹ back onto the fragment and produce a CJK radical.
 */
const ORPHAN_SPECS: [string, string][] = [
  // Superscripts: E2 [81] xx
  ["â°", "⁰"], // ⁰
  ["â¹", "⁹"], // ⁹
  ["â´", "⁴"], // ⁴
  ["âµ", "⁵"], // ⁵
  ["â¶", "⁶"], // ⁶
  ["â·", "⁷"], // ⁷
  ["â¸", "⁸"], // ⁸
  ["â»", "⁻"], // ⁻
  ["âº", "⁺"], // ⁺
  ["â½", "⁽"], // ⁽
  ["â¾", "⁾"], // ⁾
  ["â¿", "ⁿ"], // ⁿ
  ["â±", "ⁱ"], // ⁱ
  // Subscript one: E2 82 [81]
  ["â‚", "₁"], // ₁
  // Right double quote: E2 80 [9D]
  ["â€", "”"], // ”
  // Greek rho: CF [81]
  ["Ï", "ρ"], // ρ
]

const ORPHANS: [RegExp, string][] = ORPHAN_SPECS.map(([fragment, replacement]) => [
  new RegExp(fragment + "(?![" + CONTINUATION + "])", "g"),
  replacement,
])

/**
 * Repair one pass of CP1252-mangled UTF-8. Scans left to right and only
 * rewrites byte sequences that decode cleanly, so mixed content (part
 * mangled, part fine) is handled correctly.
 */
function repairPass(text: string): string {
  let out = ""
  let i = 0

  while (i < text.length) {
    const lead = toByte(text[i])
    const need = lead === null ? 0 : continuationCount(lead)

    if (need > 0 && i + need < text.length) {
      const bytes: number[] = [lead as number]
      let ok = true

      for (let k = 1; k <= need; k++) {
        const b = toByte(text[i + k])
        if (b === null || b < 0x80 || b > 0xbf) { ok = false; break }
        bytes.push(b)
      }

      if (ok) {
        const decoded = decodeUtf8(bytes)
        if (decoded !== null) {
          out += decoded
          i += need + 1
          continue
        }
      }
    }

    out += text[i]
    i++
  }

  return out
}

/**
 * Undo CP1252 mojibake. Safe to call on clean text — it returns the input
 * unchanged when there is nothing that looks mangled.
 */
export function fixMojibake(text: string): string {
  // Fast path. Every form of this damage leaves at least one character in the
  // Latin-1 supplement range, so clean text exits here. The gate cannot be
  // SUSPECT itself: text holding only orphan fragments ("Ï_w" for ρ_w) has no
  // complete two-character sequence and would be skipped entirely.
  if (!text || !/[Â-ô]/.test(text)) return text

  let out = text
  for (const [re, replacement] of ORPHANS) out = out.replace(re, replacement)

  // Text that was mangled twice needs two passes; three is a safety stop.
  for (let pass = 0; pass < 3 && SUSPECT.test(out); pass++) {
    const next = repairPass(out)
    if (next === out) break
    out = next
  }

  // A lone "Â" is always debris from a C2 byte whose partner was lost. Only
  // strip it when it isn't starting a real word, to spare genuine accents.
  out = out.replace(/Â(?![A-Za-zÀ-ÿ])/g, "")

  return out
}
