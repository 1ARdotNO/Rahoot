import {
  QuestionType,
  Quizz,
  QuizzItem,
  QuizzQuestion,
} from "@rahoot/common/types/game"
import { quizzValidator } from "@rahoot/common/validators/quizz"

export type ImageUpload = { data: string }

export type DraftItem = QuizzItem & {
  key: string
  imageFile?: ImageUpload
}

export type DraftQuestion = Extract<DraftItem, { question: string }>

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  single: "Single choice",
  multiple: "Multiple correct",
  truefalse: "True / False",
  typed: "Typed answer",
  slider: "Slider (number)",
}

export const ACCEPTED_IMAGE_TYPES = [
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
]

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

let keyCounter = 0
export const newKey = () => {
  keyCounter += 1

  return `item-${Date.now()}-${keyCounter}`
}

const questionBase = (from?: Partial<QuizzQuestion>) => ({
  question: from?.question ?? "",
  image: from?.image,
  video: from?.video,
  audio: from?.audio,
  cooldown: from?.cooldown ?? 5,
  time: from?.time ?? 20,
})

// Builds a question of `type`, keeping shared fields and any answers that still fit.
export const makeQuestion = (
  type: QuestionType,
  from?: DraftItem,
): DraftItem => {
  const previous = from && from.type !== "slide" ? from : undefined
  const base = {
    ...questionBase(previous),
    key: from?.key ?? newKey(),
    imageFile: from?.imageFile,
  }
  const previousAnswers =
    previous && "answers" in previous ? previous.answers : undefined
  const answers =
    previousAnswers && previousAnswers.length >= 2
      ? previousAnswers
      : ["", "", "", ""]

  switch (type) {
    case "single":
      return { ...base, type, answers, solution: 0 }

    case "multiple":
      return { ...base, type, answers, solutions: [] }

    case "truefalse":
      return { ...base, type, solution: true }

    case "typed":
      return { ...base, type, acceptedAnswers: [""] }

    default:
      return {
        ...base,
        type,
        min: 0,
        max: 100,
        step: 1,
        solution: 50,
        tolerance: 0,
      }
  }
}

export const makeSlide = (): DraftItem => ({
  key: newKey(),
  type: "slide",
  title: "",
  content: "",
})

export const toDraft = (item: QuizzItem): DraftItem => ({
  ...item,
  key: newKey(),
})

// Drops blank answer rows and remaps solution indexes onto the remaining ones.
const compactChoices = (item: DraftItem): QuizzItem => {
  if (item.type !== "single" && item.type !== "multiple") {
    return item
  }

  const kept = item.answers
    .map((text, index) => ({ text: text.trim(), index }))
    .filter(({ text }) => text)
  const remap = (index: number) => kept.findIndex((k) => k.index === index)
  const answers = kept.map(({ text }) => text)

  if (item.type === "single") {
    return { ...item, answers, solution: remap(item.solution) }
  }

  return {
    ...item,
    answers,
    solutions: item.solutions.map(remap).filter((i) => i >= 0),
  }
}

const stripDraftFields = ({ key: _key, imageFile, ...item }: DraftItem) => {
  const clean = { ...item } as QuizzItem

  // A pending upload replaces the data: URL preview once the server stores it.
  if (imageFile) {
    delete clean.image
  }

  if (clean.type === "typed") {
    clean.acceptedAnswers = clean.acceptedAnswers
      .map((a) => a.trim())
      .filter(Boolean)
  }

  return compactChoices(clean as DraftItem)
}

export type BuildResult =
  | {
      ok: true
      quizz: Quizz
      images: { questionIndex: number; data: string }[]
    }
  | { ok: false; error: string }

export const buildQuizz = (
  subject: string,
  items: DraftItem[],
): BuildResult => {
  for (const [index, item] of items.entries()) {
    const label = `Item ${index + 1}`

    if (item.type === "single" && !item.answers[item.solution]?.trim()) {
      return { ok: false, error: `${label}: the correct answer is empty` }
    }

    if (
      item.type === "multiple" &&
      !item.solutions.some((s) => item.answers[s]?.trim())
    ) {
      return { ok: false, error: `${label}: mark at least one correct answer` }
    }
  }

  const images = items.flatMap((item, questionIndex) =>
    item.imageFile ? [{ questionIndex, data: item.imageFile.data }] : [],
  )
  const parsed = quizzValidator.safeParse({
    subject,
    questions: items.map(stripDraftFields),
  })

  if (!parsed.success) {
    const [issue] = parsed.error.issues
    const [, index] = issue.path
    const where =
      typeof index === "number"
        ? `Item ${index + 1}`
        : String(issue.path[0] ?? "Quiz")

    return { ok: false, error: `${where}: ${issue.message}` }
  }

  return { ok: true, quizz: parsed.data, images }
}
