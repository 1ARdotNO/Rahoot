import {
  Answer,
  Player,
  PublicPlayer,
  QuizzQuestion,
} from "@rahoot/common/types/game"
import { StatusDataMap } from "@rahoot/common/types/game/status"
import { getChoices } from "@rahoot/common/validators/quizz"
import {
  correctChoiceIndexes,
  evaluateAnswer,
  normalizeTyped,
  streakBonus,
} from "@rahoot/socket/utils/quizz"

const MAX_TYPED_SUBMISSIONS_SHOWN = 12

export const toPublic = ({ id, username, points }: Player): PublicPlayer => ({
  id,
  username,
  points,
})

const groupTyped = (item: QuizzQuestion, answers: Answer[]) => {
  const grouped = new Map<string, { text: string; count: number }>()

  for (const { value } of answers) {
    const text = String(value).trim()
    const key = normalizeTyped(text)
    const entry = grouped.get(key) ?? { text, count: 0 }
    entry.count += 1
    grouped.set(key, entry)
  }

  return [...grouped.values()]
    .map((entry) => ({
      ...entry,
      correct: evaluateAnswer(item, entry.text).correct,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, MAX_TYPED_SUBMISSIONS_SHOWN)
}

export const buildResponses = (
  item: QuizzQuestion,
  answers: Answer[],
): StatusDataMap["SHOW_RESPONSES"] => {
  const choices = getChoices(item)
  const responses: Record<number, number> = {}

  const pickedIndexes =
    choices.length > 0
      ? answers.flatMap(({ value }) => (Array.isArray(value) ? value : [value]))
      : []

  for (const index of pickedIndexes) {
    if (typeof index === "number") {
      responses[index] = (responses[index] || 0) + 1
    }
  }

  return {
    type: item.type,
    question: item.question,
    image: item.image,
    answers: choices,
    responses,
    correct: correctChoiceIndexes(item),
    typed:
      item.type === "typed"
        ? { accepted: item.acceptedAnswers, submissions: groupTyped(item, answers) }
        : undefined,
    slider:
      item.type === "slider"
        ? {
            min: item.min,
            max: item.max,
            step: item.step,
            solution: item.solution,
            tolerance: item.tolerance,
            guesses: answers.map(({ value }) => value as number),
          }
        : undefined,
  }
}

export type Outcome = {
  correct: boolean
  points: number
  bonus: number
  message: string
}

// Applies the round's points and streaks to `players` in place.
export const scoreRound = (
  item: QuizzQuestion,
  players: Player[],
  answers: Answer[],
  streakBonusEnabled: boolean,
): Map<string, Outcome> => {
  const outcomes = new Map<string, Outcome>()

  for (const player of players) {
    const answer = answers.find((a) => a.playerId === player.id)
    const { correct, accuracy } = evaluateAnswer(item, answer?.value)
    const points = answer ? Math.round(answer.timePoints * accuracy) : 0

    player.streak = correct ? player.streak + 1 : 0

    const bonus =
      streakBonusEnabled && correct ? streakBonus(player.streak) : 0

    player.points += points + bonus

    let message = "Too bad"

    if (correct) {
      message = "Nice!"
    } else if (points > 0) {
      message = "Close!"
    }

    outcomes.set(player.id, { correct, points: points + bonus, bonus, message })
  }

  return outcomes
}
