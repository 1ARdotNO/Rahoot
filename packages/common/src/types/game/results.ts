import type { GameOptions, QuestionType } from "."

export type ResultAnswer = {
  username: string
  // Human-readable answer, or null when the player didn't answer.
  answer: string | null
  correct: boolean
  points: number
}

export type ResultRound = {
  questionNumber: number
  type: QuestionType
  question: string
  correctAnswer: string
  skipped: boolean
  answers: ResultAnswer[]
}

export type ResultPlayer = {
  username: string
  rank: number
  points: number
  correct: number
  bot?: boolean
}

export type GameResult = {
  id: string
  quizzId: string
  subject: string
  startedAt: string
  finishedAt: string | null
  completed: boolean
  options: GameOptions
  players: ResultPlayer[]
  rounds: ResultRound[]
}

export type GameResultSummary = {
  id: string
  quizzId: string
  subject: string
  startedAt: string
  completed: boolean
  playerCount: number
  questionCount: number
  winner: string | null
}
