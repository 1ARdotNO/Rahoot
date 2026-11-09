import z from "zod"

// Ids become filenames under config/quizz, so path separators and dots are rejected.
export const quizzIdValidator = z
  .string()
  .regex(/^[A-Za-z0-9_-]{1,64}$/u, "Invalid quizz id")

const mediaUrl = z.string().max(2048).optional()

export const questionValidator = z.object({
  question: z.string().trim().min(1).max(500),
  image: mediaUrl,
  video: mediaUrl,
  audio: mediaUrl,
  answers: z.array(z.string().trim().min(1).max(200)).min(2).max(4),
  solution: z.number().int().min(0),
  cooldown: z.number().int().min(1).max(60),
  time: z.number().int().min(1).max(600),
})

export const quizzValidator = z.object({
  subject: z.string().trim().min(1).max(200),
  questions: z
    .array(questionValidator)
    .min(1)
    .max(200)
    .refine((qs) => qs.every((q) => q.solution < q.answers.length), {
      message: "Solution index out of range",
    }),
})
