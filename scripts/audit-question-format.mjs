/**
 * Audits every question, option and explanation in the database against the
 * formatting layer in src/lib/question-format, and reports what it could not
 * repair. Run this after importing a new bank.
 *
 *   node --experimental-strip-types scripts/audit-question-format.mjs
 *
 * Add --show to print the offending rows rather than just counting them.
 *
 * Nothing is written back: this only reads and reports.
 */
import fs from "node:fs"
import os from "node:os"
import path from "node:path"

const ROOT = path.resolve(import.meta.dirname, "..")
const SHOW = process.argv.includes("--show")

// ── Load the formatter ────────────────────────────────────────────────────
// The module's imports are extensionless (correct for Next), which node's ESM
// loader won't resolve, so stage a copy with explicit extensions.
const SRC = path.join(ROOT, "src/lib/question-format")
const STAGE = fs.mkdtempSync(path.join(os.tmpdir(), "qf-audit-"))

for (const file of fs.readdirSync(SRC)) {
  if (!file.endsWith(".ts")) continue // .tsx needs a JSX transform; not needed here
  const body = fs.readFileSync(path.join(SRC, file), "utf8")
    .replace(/from "\.\/([a-zA-Z-]+)"/g, 'from "./$1.ts"')
  fs.writeFileSync(path.join(STAGE, file), body)
}

const { normalizeText } = await import(path.join(STAGE, "normalize.ts"))

// ── Connect ───────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  fs.readFileSync(path.join(ROOT, ".env.local"), "utf8")
    .split("\n").filter((l) => l.includes("=")).map((l) => {
      const i = l.indexOf("=")
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]
    })
)

const URL = env.NEXT_PUBLIC_SUPABASE_URL
const KEY = env.SUPABASE_SERVICE_ROLE_KEY
if (!URL || !KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local")
  process.exit(1)
}

async function fetchAll(table, columns) {
  const rows = []
  for (let from = 0; ; from += 1000) {
    let res
    try {
      res = await fetch(`${URL}/rest/v1/${table}?select=${columns}`, {
        headers: { apikey: KEY, Authorization: `Bearer ${KEY}`, Range: `${from}-${from + 999}` },
      })
    } catch (err) {
      console.error(`  could not reach Supabase: ${err.cause?.code ?? err.message}`)
      process.exit(1)
    }
    if (!res.ok) {
      console.error(`  ${table}: ${res.status} ${await res.text()}`)
      return rows
    }
    const page = await res.json()
    rows.push(...page)
    if (page.length < 1000) break
  }
  return rows
}

// ── What counts as unrepaired ─────────────────────────────────────────────
const RESIDUE = [
  ["mojibake",         /[Â-ô][-¿€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ]/],
  ["orphan fragment",  /[âÎÏ](?![a-zA-Z])/],
  ["html tag",         /<\/?[a-z]/i],
  ["html entity",      /&[a-z]+;|&#\d+;/i],
  ["invisible char",   /[​-‍⁠-⁤﻿]/],
  ["math bar",         /∣/],
  ["ring degree",      /∘/],
  ["duplicated exp",   /(−\d+)\1/],
  ["unrendered latex", /\\[a-zA-Z]{2,}/],
]

console.log("Fetching…")
const questions = await fetchAll("questions", "id,text,explanation")
const options = await fetchAll("options", "id,text")
console.log(`  ${questions.length} questions, ${options.length} options\n`)

const counts = new Map()
const examples = new Map()
let checked = 0

function check(id, field, raw, kind) {
  if (!raw) return
  checked++
  const out = normalizeText(raw, { kind })
  for (const [name, re] of RESIDUE) {
    if (!re.test(out)) continue
    counts.set(name, (counts.get(name) ?? 0) + 1)
    if (!examples.has(name)) examples.set(name, { id, field, raw, out })
  }
}

for (const q of questions) {
  check(q.id, "text", q.text, "question")
  check(q.id, "explanation", q.explanation, "explanation")
}
for (const o of options) check(o.id, "text", o.text, "option")

console.log(`Checked ${checked} fields.\n`)

if (counts.size === 0) {
  console.log("No unrepaired formatting found.")
} else {
  for (const [name, count] of [...counts].sort((a, b) => b[1] - a[1])) {
    console.log(`${String(count).padStart(6)}  ${name}`)
    if (SHOW) {
      const e = examples.get(name)
      console.log(`        ${e.field} ${e.id}`)
      console.log(`        raw: ${e.raw.slice(0, 160)}`)
      console.log(`        out: ${e.out.slice(0, 160)}\n`)
    }
  }
  if (!SHOW) console.log("\nRe-run with --show to see an example of each.")
}

fs.rmSync(STAGE, { recursive: true, force: true })
