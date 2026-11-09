import { PublicPlayer, QuestionType } from "."

export const STATUS = {
  SHOW_ROOM: "SHOW_ROOM",
  SHOW_START: "SHOW_START",
  SHOW_PREPARED: "SHOW_PREPARED",
  SHOW_QUESTION: "SHOW_QUESTION",
  SELECT_ANSWER: "SELECT_ANSWER",
  SHOW_RESULT: "SHOW_RESULT",
  SHOW_RESPONSES: "SHOW_RESPONSES",
  SHOW_LEADERBOARD: "SHOW_LEADERBOARD",
  SHOW_SLIDE: "SHOW_SLIDE",
  FINISHED: "FINISHED",
  WAIT: "WAIT",
} as const

export type Status = (typeof STATUS)[keyof typeof STATUS]

export type SliderConfig = { min: number; max: number; step: number }

export type CommonStatusDataMap = {
  SHOW_START: { time: number; subject: string }
  SHOW_PREPARED: {
    type: QuestionType
    totalAnswers: number
    questionNumber: number
  }
  SHOW_QUESTION: { question: string; image?: string; cooldown: number }
  SELECT_ANSWER: {
    type: QuestionType
    question: string
    answers: string[]
    slider?: SliderConfig
    image?: string
    video?: string
    audio?: string
    time: number
    totalPlayer: number
  }
  SHOW_RESULT: {
    correct: boolean
    message: string
    points: number
    myPoints: number
    rank: number
    aheadOfMe: string | null
    correctAnswer: string
    streak: number
    streakBonus: number
  }
  SHOW_SLIDE: { title?: string; content: string; image?: string }
  WAIT: { text: string }
  FINISHED: { subject: string; top: PublicPlayer[] }
}

type ManagerExtraStatus = {
  SHOW_ROOM: { text: string; inviteCode?: string }
  SHOW_RESPONSES: {
    type: QuestionType
    question: string
    image?: string
    video?: string
    answers: string[]
    responses: Record<number, number>
    correct: number[]
    typed?: {
      accepted: string[]
      submissions: { text: string; count: number; correct: boolean }[]
    }
    slider?: SliderConfig & {
      solution: number
      tolerance: number
      guesses: number[]
    }
  }
  SHOW_LEADERBOARD: {
    oldLeaderboard: PublicPlayer[]
    leaderboard: PublicPlayer[]
    commentary: string[]
  }
}

export type PlayerStatusDataMap = CommonStatusDataMap
export type ManagerStatusDataMap = CommonStatusDataMap & ManagerExtraStatus
export type StatusDataMap = PlayerStatusDataMap & ManagerStatusDataMap
