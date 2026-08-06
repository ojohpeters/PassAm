import type { ReactNode } from "react"

/**
 * A small LaTeX renderer covering the subset that actually appears in the
 * question banks: fractions, roots, matrices, super/subscripts, the Greek
 * and operator symbols, and the named functions.
 *
 * This deliberately isn't KaTeX. The full library plus its font files is
 * roughly 280KB before any of it renders, which is a poor trade for an app
 * whose users are overwhelmingly on mobile data — and it would need extra
 * work to cache for offline use. Everything below is layout done with flex
 * and a border, so it costs nothing extra to ship and works offline.
 *
 * Anything unrecognised degrades to its own text rather than vanishing.
 */

const SYMBOLS: Record<string, string> = {
  // Operators and relations
  times: "×", div: "÷", pm: "±", mp: "∓", cdot: "·", ast: "∗",
  le: "≤", leq: "≤", ge: "≥", geq: "≥", ne: "≠", neq: "≠",
  approx: "≈", equiv: "≡", sim: "∼", propto: "∝", cong: "≅",
  ll: "≪", gg: "≫",
  // Set theory and logic
  cup: "∪", cap: "∩", subset: "⊂", subseteq: "⊆", supset: "⊃",
  supseteq: "⊇", in: "∈", notin: "∉", emptyset: "∅", varnothing: "∅",
  forall: "∀", exists: "∃", neg: "¬", land: "∧", lor: "∨",
  therefore: "∴", because: "∵",
  // Arrows
  to: "→", rightarrow: "→", Rightarrow: "⇒", leftarrow: "←",
  Leftarrow: "⇐", leftrightarrow: "↔", Leftrightarrow: "⇔", mapsto: "↦",
  // Big operators
  int: "∫", iint: "∬", oint: "∮", sum: "∑", prod: "∏",
  infty: "∞", partial: "∂", nabla: "∇", surd: "√",
  // Geometry
  angle: "∠", triangle: "△", perp: "⊥", parallel: "∥", circ: "∘",
  degree: "°", prime: "′",
  // Lowercase Greek
  alpha: "α", beta: "β", gamma: "γ", delta: "δ", epsilon: "ε",
  varepsilon: "ε", zeta: "ζ", eta: "η", theta: "θ", vartheta: "ϑ",
  iota: "ι", kappa: "κ", lambda: "λ", mu: "μ", nu: "ν", xi: "ξ",
  pi: "π", rho: "ρ", sigma: "σ", tau: "τ", upsilon: "υ", phi: "φ",
  varphi: "φ", chi: "χ", psi: "ψ", omega: "ω",
  // Uppercase Greek
  Gamma: "Γ", Delta: "Δ", Theta: "Θ", Lambda: "Λ", Xi: "Ξ", Pi: "Π",
  Sigma: "Σ", Upsilon: "Υ", Phi: "Φ", Psi: "Ψ", Omega: "Ω",
  // Delimiters and spacing
  lbrace: "{", rbrace: "}", langle: "⟨", rangle: "⟩", vert: "|", Vert: "‖",
  ldots: "…", cdots: "⋯", quad: " ", qquad: "  ",
}

/**
 * Named functions are set upright with a thin space *before* them, which
 * separates the name from whatever precedes it ("x\cot x" → "x cot x").
 * Nothing is added after, because the source already supplies that space.
 */
const FUNCTIONS = new Set([
  "sin", "cos", "tan", "csc", "sec", "cot",
  "arcsin", "arccos", "arctan", "sinh", "cosh", "tanh",
  "log", "ln", "lg", "exp", "lim", "max", "min", "det", "gcd", "deg",
])

/** Commands that style their argument but need no visual treatment here. */
const PASSTHROUGH = new Set(["mathrm", "mathit", "text", "textrm", "operatorname", "mbox"])

const BOLD = new Set(["mathbf", "textbf", "bf", "boldsymbol"])

/** Zero-width spacing commands. */
const THIN_SPACES = new Set([",", ";", ":", "!", " ", "\n"])

const MATRIX_FENCES: Record<string, [string, string] | null> = {
  pmatrix: ["(", ")"],
  bmatrix: ["[", "]"],
  vmatrix: ["|", "|"],
  Bmatrix: ["{", "}"],
  matrix: null,
}

class LatexParser {
  private i = 0
  private key = 0

  constructor(private readonly src: string) {}

  private nextKey(): number {
    return this.key++
  }

  /** Parse until the closing brace of the current group, or the end. */
  parse(depth = 0): ReactNode[] {
    const nodes: ReactNode[] = []
    let text = ""

    const flush = () => {
      if (text) { nodes.push(text); text = "" }
    }

    while (this.i < this.src.length) {
      const ch = this.src[this.i]

      if (ch === "}") {
        if (depth > 0) { this.i++; break }
        this.i++
        continue
      }

      if (ch === "{") {
        this.i++
        flush()
        nodes.push(<span key={this.nextKey()}>{this.parse(depth + 1)}</span>)
        continue
      }

      if (ch === "^" || ch === "_") {
        this.i++
        flush()
        const inner = this.readArgument()
        nodes.push(
          ch === "^"
            ? <sup key={this.nextKey()} className="text-[0.72em]">{inner}</sup>
            : <sub key={this.nextKey()} className="text-[0.72em]">{inner}</sub>
        )
        continue
      }

      if (ch === "\\") {
        const command = this.readCommand()
        const rendered = this.renderCommand(command, depth)
        if (rendered === null) continue
        if (typeof rendered === "string") { text += rendered; continue }
        flush()
        nodes.push(rendered)
        continue
      }

      text += ch
      this.i++
    }

    flush()
    return nodes
  }

  /** Read the command name after a backslash. */
  private readCommand(): string {
    this.i++ // consume the backslash
    const letters = /[a-zA-Z]/
    if (this.i < this.src.length && letters.test(this.src[this.i])) {
      let name = ""
      while (this.i < this.src.length && letters.test(this.src[this.i])) {
        name += this.src[this.i]
        this.i++
      }
      return name
    }
    const single = this.src[this.i] ?? ""
    this.i++
    return single
  }

  private skipSpaces(): void {
    while (this.i < this.src.length && /\s/.test(this.src[this.i])) this.i++
  }

  /**
   * Read one argument: a braced group, or the single next token when the
   * braces were omitted, as in "\mathrm d" or "x^2".
   */
  private readArgument(): ReactNode[] {
    this.skipSpaces()
    if (this.src[this.i] === "{") {
      this.i++
      return this.parse(1)
    }
    if (this.src[this.i] === "\\") {
      const command = this.readCommand()
      const rendered = this.renderCommand(command, 1)
      return rendered === null ? [] : [rendered]
    }
    const ch = this.src[this.i]
    if (ch === undefined) return []
    this.i++
    return [ch]
  }

  /** Returns a string to append, a node to push, or null to skip. */
  private renderCommand(command: string, depth: number): ReactNode | string | null {
    if (command === "frac" || command === "dfrac" || command === "tfrac") {
      const numerator = this.readArgument()
      const denominator = this.readArgument()
      return (
        <span
          key={this.nextKey()}
          className="mx-0.5 inline-flex flex-col items-center align-middle text-[0.92em] leading-tight"
        >
          <span className="px-1">{numerator}</span>
          <span className="w-full border-t border-current px-1">{denominator}</span>
        </span>
      )
    }

    if (command === "sqrt") {
      let index: ReactNode[] | null = null
      this.skipSpaces()
      if (this.src[this.i] === "[") {
        this.i++
        const close = this.src.indexOf("]", this.i)
        const raw = close === -1 ? "" : this.src.slice(this.i, close)
        this.i = close === -1 ? this.src.length : close + 1
        index = renderLatex(raw)
      }
      const radicand = this.readArgument()
      return (
        <span key={this.nextKey()} className="inline-flex items-start align-middle">
          {index && <span className="mr-[-0.3em] self-start text-[0.6em]">{index}</span>}
          <span className="text-[1.1em] leading-none">√</span>
          <span className="border-t border-current pl-0.5 pt-px">{radicand}</span>
        </span>
      )
    }

    if (command === "begin") return this.readEnvironment()
    if (command === "end") { this.readArgument(); return null }

    if (command === "left" || command === "right") {
      this.skipSpaces()
      const delimiter = this.src[this.i] ?? ""
      this.i++
      return delimiter === "." ? null : delimiter
    }

    if (PASSTHROUGH.has(command)) {
      return <span key={this.nextKey()}>{this.readArgument()}</span>
    }

    if (BOLD.has(command)) {
      return <span key={this.nextKey()} className="font-semibold">{this.readArgument()}</span>
    }

    if (command === "overline" || command === "bar") {
      return (
        <span key={this.nextKey()} className="border-t border-current">
          {this.readArgument()}
        </span>
      )
    }

    if (FUNCTIONS.has(command)) return ` ${command}`
    if (SYMBOLS[command] !== undefined) return SYMBOLS[command]
    if (THIN_SPACES.has(command)) return " "

    // A row break outside a matrix is just a line break.
    if (command === "\\") return depth === 0 ? " " : " "

    // Unknown control sequence — show its name rather than dropping content.
    return command
  }

  /** Handle \begin{pmatrix} ... \end{pmatrix} and friends. */
  private readEnvironment(): ReactNode | null {
    this.skipSpaces()
    if (this.src[this.i] !== "{") return null
    const close = this.src.indexOf("}", this.i)
    if (close === -1) return null
    const name = this.src.slice(this.i + 1, close)
    this.i = close + 1

    const endMarker = `\\end{${name}}`
    const endIndex = this.src.indexOf(endMarker, this.i)
    const body = this.src.slice(this.i, endIndex === -1 ? this.src.length : endIndex)
    this.i = endIndex === -1 ? this.src.length : endIndex + endMarker.length

    if (!(name in MATRIX_FENCES)) {
      return <span key={this.nextKey()}>{renderLatex(body)}</span>
    }

    const rows = body.split("\\\\").map((row) => row.split("&"))
    const columns = Math.max(...rows.map((row) => row.length))
    const fences = MATRIX_FENCES[name]

    return (
      <span key={this.nextKey()} className="mx-0.5 inline-flex items-stretch align-middle">
        {fences && <Fence side="left" shape={name} />}
        <span
          className="grid gap-x-3 gap-y-0.5 px-1.5 py-0.5 text-center"
          style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, auto))` }}
        >
          {rows.map((row, r) =>
            Array.from({ length: columns }, (_unused, c) => (
              <span key={`${r}-${c}`}>{renderLatex(row[c] ?? "")}</span>
            ))
          )}
        </span>
        {fences && <Fence side="right" shape={name} />}
      </span>
    )
  }
}

function Fence({ side, shape }: { side: "left" | "right"; shape: string }) {
  if (shape === "vmatrix") {
    return <span className={side === "left" ? "border-l border-current" : "border-r border-current"} />
  }
  const rounded = shape === "pmatrix"
  return (
    <span
      className={[
        "w-1.5 border-current",
        side === "left" ? "border-y border-l" : "border-y border-r",
        rounded ? (side === "left" ? "rounded-l-[6px]" : "rounded-r-[6px]") : "",
      ].join(" ")}
    />
  )
}

/** Render a LaTeX fragment (the contents of a \( … \) span). */
export function renderLatex(source: string): ReactNode[] {
  return new LatexParser(source).parse()
}
