import {
  Answer,
  GameOptions,
  Player,
  QuizzQuestion,
} from "@rahoot/common/types/game"
import { GameResult } from "@rahoot/common/types/game/results"
import Results from "@rahoot/socket/services/results"
import { describeAnswer, describeSolution } from "@rahoot/socket/utils/quizz"
import { Outcome } from "@rahoot/socket/utils/results"
import { randomBytes } from "crypto"

type Meta = {
  owner: string | null
  quizzId: string
  subject: string
  options: GameOptions
}

const makeId = (date: Date) =>
  `${date.toISOString().replace(/[-:]/gu, "").replace("T", "-").slice(0, 15)}-${randomBytes(3).toString("hex")}`

// Writes the result file after every round so abandoned or crashed games still leave a record.
class ResultRecorder {
  private readonly owner: string | null

  private readonly enabled: boolean

  private readonly result: GameResult

  constructor({ owner, quizzId, subject, options }: Meta) {
    const now = new Date()

    this.owner = owner
    this.enabled = options.saveResults
    this.result = {
      id: makeId(now),
      quizzId,
      subject,
      startedAt: now.toISOString(),
      finishedAt: null,
      completed: false,
      options,
      players: [],
      rounds: [],
    }
  }

  recordRound({
    item,
    questionNumber,
    players,
    answers,
    outcomes,
  }: {
    item: QuizzQuestion
    questionNumber: number
    players: Player[]
    answers: Answer[]
    outcomes: Map<string, Outcome>
  }) {
    this.result.rounds.push({
      questionNumber,
      type: item.type,
      question: item.question,
      correctAnswer: describeSolution(item),
      skipped: false,
      answers: players.map((player) => {
        const answer = answers.find((a) => a.playerId === player.id)
        const outcome = outcomes.get(player.id)

        return {
          username: player.username,
          answer: describeAnswer(item, answer?.value),
          correct: outcome?.correct ?? false,
          points: outcome?.points ?? 0,
        }
      }),
    })
    this.persist(players)
  }

  recordSkip(item: QuizzQuestion, questionNumber: number, players: Player[]) {
    this.result.rounds.push({
      questionNumber,
      type: item.type,
      question: item.question,
      correctAnswer: describeSolution(item),
      skipped: true,
      answers: [],
    })
    this.persist(players)
  }

  finish(players: Player[]) {
    this.result.completed = true
    this.result.finishedAt = new Date().toISOString()
    this.persist(players)
  }

  private persist(players: Player[]) {
    if (!this.enabled) {
      return
    }

    const correctCounts = new Map<string, number>()

    for (const round of this.result.rounds) {
      for (const answer of round.answers) {
        if (answer.correct) {
          correctCounts.set(answer.username, (correctCounts.get(answer.username) ?? 0) + 1)
        }
      }
    }

    this.result.players = [...players]
      .sort((a, b) => b.points - a.points)
      .map((player, index) => ({
        username: player.username,
        rank: index + 1,
        points: player.points,
        correct: correctCounts.get(player.username) ?? 0,
        ...(player.bot ? { bot: true } : {}),
      }))

    try {
      Results.save(this.owner, this.result)
    } catch (error) {
      // Losing a results file must never break a live game.
      console.error("Failed to save game results:", error)
    }
  }
}

export default ResultRecorder
