import z from "zod"

// Ids become filenames under config/quizz, so path separators and dots are rejected.
export const quizzIdValidator = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,64}$/u, "Invalid quizz id")

const mediaUrl = z.string().max(2048).optional()
const answerText = z.string().trim().min(1).max(200)

const questionBase = {
  question: z.string().trim().min(1).max(500),
  image: mediaUrl,
  video: mediaUrl,
  audio: mediaUrl,
  cooldown: z.number().int().min(1).max(60),
  time: z.number().int().min(1).max(600),
}

const singleQuestion = z.object({
  ...questionBase,
  type: z.literal("single"),
  answers: z.array(answerText).min(2).max(4),
  solution: z.number().int().min(0),
})

const multipleQuestion = z.object({
  ...questionBase,
  type: z.literal("multiple"),
  answers: z.array(answerText).min(2).max(4),
  solutions: z.array(z.number().int().min(0)).min(1).max(4),
})

const trueFalseQuestion = z.object({
  ...questionBase,
  type: z.literal("truefalse"),
  solution: z.boolean(),
})

const typedQuestion = z.object({
  ...questionBase,
  type: z.literal("typed"),
  acceptedAnswers: z.array(answerText).min(1).max(20),
})

const sliderQuestion = z.object({
  ...questionBase,
  type: z.literal("slider"),
  min: z.number().finite(),
  max: z.number().finite(),
  step: z.number().finite().positive(),
  solution: z.number().finite(),
  tolerance: z.number().finite().min(0).default(0),
})

const slide = z.object({
  type: z.literal("slide"),
  title: z.string().trim().max(200).optional(),
  content: z.string().max(10000).default(""),
  image: mediaUrl,
})

const itemShape = z.discriminatedUnion("type", [
  singleQuestion,
  multipleQuestion,
  trueFalseQuestion,
  typedQuestion,
  sliderQuestion,
  slide,
])

// Quizzes written before question types existed have no `type` and are single-choice.
export const quizzItemValidator = z.preprocess(
  (value) =>
    value && typeof value === "object" && !("type" in value)
      ? { ...value, type: "single" }
      : value,
  itemShape.superRefine((item, ctx) => {
    switch (item.type) {
      case "single":
        if (item.solution >= item.answers.length) {
          ctx.addIssue({ code: "custom", message: "Solution index out of range" })
        }

        break

      case "multiple":
        if (
          item.solutions.some((s) => s >= item.answers.length) ||
          new Set(item.solutions).size !== item.solutions.length
        ) {
          ctx.addIssue({ code: "custom", message: "Invalid solutions" })
        }

        break

      case "slider":
        if (item.min >= item.max) {
          ctx.addIssue({ code: "custom", message: "Slider min must be below max" })
        }

        if (item.solution < item.min || item.solution > item.max) {
          ctx.addIssue({
            code: "custom",
            message: "Slider solution must be within min and max",
          })
        }

        if (item.step > item.max - item.min) {
          ctx.addIssue({ code: "custom", message: "Slider step is too large" })
        }

        break
    }
  }),
)

export const quizzValidator = z.object({
  subject: z.string().trim().min(1).max(200),
  questions: z
    .array(quizzItemValidator)
    .min(1)
    .max(200)
    .refine((items) => items.some((item) => item.type !== "slide"), {
      message: "Quizz needs at least one question",
    }),
})

export const gameOptionsValidator = z.object({
  shuffleQuestions: z.boolean().default(false),
  shuffleAnswers: z.boolean().default(false),
  streakBonus: z.boolean().default(false),
})

export type QuizzItem = z.output<typeof itemShape>
export type QuizzSlide = Extract<QuizzItem, { type: "slide" }>
export type QuizzQuestion = Exclude<QuizzItem, QuizzSlide>
export type QuestionType = QuizzQuestion["type"]
export type Quizz = z.output<typeof quizzValidator>
export type GameOptions = z.output<typeof gameOptionsValidator>

// Single/truefalse: answer index; multiple: indexes; typed: text; slider: value.
export type AnswerValue = number | number[] | string

export const TRUE_FALSE_ANSWERS = ["True", "False"]

export const getChoices = (item: QuizzQuestion): string[] => {
  if (item.type === "single" || item.type === "multiple") {
    return item.answers
  }

  return item.type === "truefalse" ? TRUE_FALSE_ANSWERS : []
}
