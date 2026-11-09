import {
  AnswerValue,
  GameOptions,
  getChoices,
  Quizz,
  QuizzItem,
  QuizzQuestion,
  TRUE_FALSE_ANSWERS,
} from "@rahoot/common/validators/quizz"

export const STREAK_BONUS_STEP = 100
export const STREAK_BONUS_MAX = 500
export const MAX_TYPED_ANSWER_LENGTH = 100

// Slider guesses further than this fraction of the range from the band earn nothing.
const SLIDER_FALLOFF = 0.25

export type Evaluation = { correct: boolean; accuracy: number }

export const isQuestion = (item: QuizzItem): item is QuizzQuestion =>
  item.type !== "slide"

export const normalizeTyped = (text: string) =>
  text
    .normalize("NFC")
    .trim()
    .toLowerCase()
    .replace(/\s+/gu, " ")
    .replace(/[.!?]+$/u, "")

const shuffle = <T>(items: T[]): T[] => {
  const result = [...items]

  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }

  return result
}

const shuffleChoices = (item: QuizzQuestion): QuizzQuestion => {
  if (item.type !== "single" && item.type !== "multiple") {
    return item
  }

  const order = shuffle(item.answers.map((_, index) => index))
  const answers = order.map((index) => item.answers[index])

  if (item.type === "single") {
    return { ...item, answers, solution: order.indexOf(item.solution) }
  }

  return {
    ...item,
    answers,
    solutions: item.solutions.map((s) => order.indexOf(s)),
  }
}

// Slides act as section dividers: questions only shuffle within their section,
// so a slide keeps introducing the block of questions that follows it.
export const prepareQuizz = (quizz: Quizz, options: GameOptions): Quizz => {
  let items = quizz.questions

  if (options.shuffleQuestions) {
    const sections: QuizzItem[][] = [[]]

    for (const item of items) {
      if (isQuestion(item)) {
        sections[sections.length - 1].push(item)
      } else {
        sections.push([item], [])
      }
    }

    items = sections.flatMap((section) =>
      section.length > 0 && isQuestion(section[0]) ? shuffle(section) : section,
    )
  }

  if (options.shuffleAnswers) {
    items = items.map((item) => (isQuestion(item) ? shuffleChoices(item) : item))
  }

  return { ...quizz, questions: items }
}

// Returns the sanitized answer, or null when it doesn't fit the question.
export const parseAnswer = (
  item: QuizzQuestion,
  value: unknown,
): AnswerValue | null => {
  const choiceCount = getChoices(item).length
  const isChoiceIndex = (v: unknown): v is number =>
    Number.isInteger(v) && (v as number) >= 0 && (v as number) < choiceCount

  if (item.type === "single" || item.type === "truefalse") {
    return isChoiceIndex(value) ? value : null
  }

  if (item.type === "multiple") {
    if (!Array.isArray(value) || value.length === 0) {
      return null
    }

    const unique = [...new Set(value)]

    return unique.every(isChoiceIndex) ? unique.sort((a, b) => a - b) : null
  }

  if (item.type === "typed") {
    return typeof value === "string" && value.trim().length > 0
      ? value.slice(0, MAX_TYPED_ANSWER_LENGTH)
      : null
  }

  return typeof value === "number" &&
    Number.isFinite(value) &&
    value >= item.min &&
    value <= item.max
    ? value
    : null
}

export const evaluateAnswer = (
  item: QuizzQuestion,
  value: AnswerValue | undefined,
): Evaluation => {
  if (value === undefined) {
    return { correct: false, accuracy: 0 }
  }

  const exact = (correct: boolean) => ({ correct, accuracy: correct ? 1 : 0 })

  switch (item.type) {
    case "single":
      return exact(value === item.solution)

    case "truefalse":
      return exact(value === (item.solution ? 0 : 1))

    case "multiple": {
      const picked = value as number[]

      return exact(
        picked.length === item.solutions.length &&
          item.solutions.every((s) => picked.includes(s)),
      )
    }

    case "typed": {
      const guess = normalizeTyped(value as string)

      return exact(item.acceptedAnswers.some((a) => normalizeTyped(a) === guess))
    }

    default: {
      const distance = Math.abs((value as number) - item.solution)

      if (distance <= item.tolerance) {
        return { correct: true, accuracy: 1 }
      }

      const falloff = (item.max - item.min) * SLIDER_FALLOFF

      return {
        correct: false,
        accuracy: Math.max(0, 1 - (distance - item.tolerance) / falloff),
      }
    }
  }
}

export const describeSolution = (item: QuizzQuestion): string => {
  switch (item.type) {
    case "single":
      return item.answers[item.solution]

    case "multiple":
      return item.solutions.map((s) => item.answers[s]).join(", ")

    case "truefalse":
      return TRUE_FALSE_ANSWERS[item.solution ? 0 : 1]

    case "typed":
      return item.acceptedAnswers[0]

    default:
      return String(item.solution)
  }
}

export const correctChoiceIndexes = (item: QuizzQuestion): number[] => {
  switch (item.type) {
    case "single":
      return [item.solution]

    case "multiple":
      return item.solutions

    case "truefalse":
      return [item.solution ? 0 : 1]

    default:
      return []
  }
}

export const streakBonus = (streak: number) =>
  Math.min(Math.max(streak - 1, 0) * STREAK_BONUS_STEP, STREAK_BONUS_MAX)

export const describeAnswer = (
  item: QuizzQuestion,
  value: AnswerValue | undefined,
): string | null => {
  if (value === undefined) {
    return null
  }

  if (typeof value === "string") {
    return value.trim()
  }

  if (item.type === "slider") {
    return String(value)
  }

  const choices = getChoices(item)

  return (Array.isArray(value) ? value : [value])
    .map((index) => choices[index] ?? `#${index}`)
    .join(", ")
}
