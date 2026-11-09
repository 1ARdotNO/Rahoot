import { QuestionType } from "@rahoot/common/types/game"

export const TYPE_META: Record<
  QuestionType | "slide",
  { icon: string; label: string }
> = {
  single: { icon: "◉", label: "Single choice" },
  multiple: { icon: "☑", label: "Multiple correct" },
  truefalse: { icon: "⊤⊥", label: "True / False" },
  typed: { icon: "Aa", label: "Typed answer" },
  slider: { icon: "⇆", label: "Slider" },
  slide: { icon: "¶", label: "Info slide" },
}

const ACCENTS = [
  { bg: "bg-red-500", soft: "bg-red-50 text-red-600" },
  { bg: "bg-blue-500", soft: "bg-blue-50 text-blue-600" },
  { bg: "bg-amber-400", soft: "bg-amber-50 text-amber-700" },
  { bg: "bg-green-500", soft: "bg-green-50 text-green-700" },
  { bg: "bg-violet-500", soft: "bg-violet-50 text-violet-600" },
  { bg: "bg-pink-500", soft: "bg-pink-50 text-pink-600" },
]

// Stable per quiz, so a quiz keeps its colour between visits.
export const accentFor = (id: string) => {
  let hash = 0

  for (const char of id) {
    hash = (hash * 31 + char.charCodeAt(0)) % 1_000_003
  }

  return ACCENTS[hash % ACCENTS.length]
}

export const plural = (n: number, word: string) =>
  `${n} ${word}${n === 1 ? "" : "s"}`
