export const ERROR_TAGS = [
  { id: "forgot_concept", label: "Forgot concept",    emoji: "🧠" },
  { id: "calc_error",     label: "Calculation error",  emoji: "🔢" },
  { id: "misread",        label: "Misread question",   emoji: "👀" },
  { id: "careless",       label: "Careless mistake",   emoji: "😅" },
  { id: "no_idea",        label: "Didn't know topic",  emoji: "❓" },
  { id: "guessed",        label: "Guessed wrong",      emoji: "🎲" },
] as const

export type ErrorTagId = (typeof ERROR_TAGS)[number]["id"]
