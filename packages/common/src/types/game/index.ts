import type {
  AnswerValue,
  BotDifficulty,
  GameOptions,
  QuestionType,
  Quizz,
  QuizzItem,
  QuizzQuestion,
  QuizzSlide,
} from "../../validators/quizz"

export type {
  AnswerValue,
  BotDifficulty,
  GameOptions,
  QuestionType,
  Quizz,
  QuizzItem,
  QuizzQuestion,
  QuizzSlide,
}

export type Player = {
  id: string
  clientId: string
  connected: boolean
  username: string
  points: number
  streak: number
  bot?: BotDifficulty
}

export type PublicPlayer = Pick<Player, "id" | "username" | "points">

export type Answer = {
  playerId: string
  value: AnswerValue
  timePoints: number
}

export type QuizzWithId = Quizz & { id: string }

export type QuizzSummary = {
  id: string
  subject: string
  questionCount: number
  slideCount: number
  types: QuestionType[]
  updatedAt: string
}

export type GameUpdateQuestion = {
  current: number
  total: number
}

export type ApiKeyInfo = {
  id: string
  label: string
  createdAt: string
  lastUsedAt: string | null
}
