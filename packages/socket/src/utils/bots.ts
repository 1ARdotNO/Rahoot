import {
  AnswerValue,
  BotDifficulty,
  Player,
  QuizzQuestion,
} from "@rahoot/common/types/game"
import { getChoices } from "@rahoot/common/validators/quizz"
import { evaluateAnswer } from "@rahoot/socket/utils/quizz"
import { v4 as uuid } from "uuid"

type Profile = {
  accuracy: number
  // Answer time as a fraction of the question's time limit.
  minDelay: number
  maxDelay: number
  missChance: number
  // Spread of wrong slider guesses as a fraction of the slider range.
  sliderSpread: number
}

const PROFILES: Record<BotDifficulty, Profile> = {
  easy: { accuracy: 0.35, minDelay: 0.35, maxDelay: 0.95, missChance: 0.1, sliderSpread: 0.35 },
  medium: { accuracy: 0.6, minDelay: 0.2, maxDelay: 0.8, missChance: 0.04, sliderSpread: 0.2 },
  hard: { accuracy: 0.82, minDelay: 0.1, maxDelay: 0.55, missChance: 0.01, sliderSpread: 0.1 },
  genius: { accuracy: 0.96, minDelay: 0.05, maxDelay: 0.3, missChance: 0, sliderSpread: 0.04 },
}

export const MAX_BOTS = 20

const BOT_NAMES = [
  "Sparky", "Beep Boop", "Quizzy", "Robo Rita", "Chip", "Bolt", "Gizmo",
  "Pixel", "Byte", "Widget", "Clanky", "Botty", "Nova", "Cogsworth", "Zap",
  "Tinker", "Rusty", "Glitch", "Ada", "Turbo", "Sprocket", "Dot", "Bleep",
]

const WRONG_TYPED = [
  "banana", "42", "no idea", "pizza", "potato", "yes", "maybe", "Bob",
  "error 404", "the moon", "beep", "cheese", "trick question", "seven",
]

// Leaves a little slack so a late bot never races the server-side timer.
const LATEST_ANSWER_MS = 400

const randomItem = <T>(items: T[]): T =>
  items[Math.floor(Math.random() * items.length)]

const between = (min: number, max: number) => min + Math.random() * (max - min)

// Roughly bell-shaped: most picks land mid-range, a few at the edges.
const bell = () => (Math.random() + Math.random() + Math.random()) / 3

export const pickBotName = (taken: string[]) => {
  const free = BOT_NAMES.filter((name) => !taken.includes(`🤖 ${name}`))

  if (free.length > 0) {
    return `🤖 ${randomItem(free)}`
  }

  let n = 2

  while (taken.includes(`🤖 Bot ${n}`)) {
    n += 1
  }

  return `🤖 Bot ${n}`
}

const snap = (
  value: number,
  { min, max, step }: { min: number; max: number; step: number },
) => {
  const snapped = min + Math.round((value - min) / step) * step

  return Number(Math.min(max, Math.max(min, snapped)).toFixed(6))
}

const correctAnswer = (item: QuizzQuestion): AnswerValue => {
  switch (item.type) {
    case "single":
      return item.solution

    case "truefalse":
      return item.solution ? 0 : 1

    case "multiple":
      return [...item.solutions]

    case "typed":
      return randomItem(item.acceptedAnswers)

    default: {
      const guess = snap(
        between(item.solution - item.tolerance, item.solution + item.tolerance),
        item,
      )

      // Snapping to the step grid can leave a narrow tolerance band; the exact value never does.
      return evaluateAnswer(item, guess).correct ? guess : item.solution
    }
  }
}

const wrongAnswer = (item: QuizzQuestion, profile: Profile): AnswerValue => {
  const choices = getChoices(item).map((_, index) => index)

  if (item.type === "single" || item.type === "truefalse") {
    const correct = correctAnswer(item)

    return randomItem(choices.filter((i) => i !== correct))
  }

  if (item.type === "multiple") {
    const subset = choices.filter(() => Math.random() < 0.5)

    return subset.length > 0 ? subset : [randomItem(choices)]
  }

  if (item.type === "typed") {
    return randomItem(WRONG_TYPED)
  }

  const offset = (bell() * 2 - 1) * (item.max - item.min) * profile.sliderSpread * 3

  return snap(item.solution + offset, item)
}

export type BotPlan = { delayMs: number; value: AnswerValue }

// Returns null when the bot "forgets" to answer this question.
export const planBotAnswer = (
  item: QuizzQuestion,
  difficulty: BotDifficulty,
): BotPlan | null => {
  const profile = PROFILES[difficulty]

  if (Math.random() < profile.missChance) {
    return null
  }

  const wantsCorrect = Math.random() < profile.accuracy
  let value = wantsCorrect ? correctAnswer(item) : wrongAnswer(item, profile)

  // A random "wrong" pick can land on the right answer; retry so accuracy stays honest.
  if (!wantsCorrect) {
    for (let tries = 0; evaluateAnswer(item, value).correct && tries < 5; tries += 1) {
      value = wrongAnswer(item, profile)
    }
  }

  const fraction = profile.minDelay + bell() * (profile.maxDelay - profile.minDelay)
  const delayMs = Math.min(fraction * item.time * 1000, item.time * 1000 - LATEST_ANSWER_MS)

  return { delayMs: Math.max(delayMs, 300), value }
}

type ScheduleOptions = {
  bots: { id: string; bot: BotDifficulty }[]
  item: QuizzQuestion
  isActive: () => boolean
  isPaused: () => boolean
  submit: (_playerId: string, _value: AnswerValue) => void
}

const PAUSE_RETRY_MS = 500

export const scheduleBotAnswers = ({
  bots,
  item,
  isActive,
  isPaused,
  submit,
}: ScheduleOptions) => {
  for (const { id, bot } of bots) {
    const plan = planBotAnswer(item, bot)

    if (!plan) {
      continue
    }

    const fire = () => {
      if (!isActive()) {
        return
      }

      // Bots wait out a pause like everyone else.
      if (isPaused()) {
        setTimeout(fire, PAUSE_RETRY_MS)

        return
      }

      submit(id, plan.value)
    }

    setTimeout(fire, plan.delayMs)
  }
}

export const createBot = (players: Player[], difficulty: BotDifficulty): Player => ({
  id: `bot-${uuid()}`,
  // Random so no client can claim a bot through the reconnect flow.
  clientId: `bot-${uuid()}`,
  connected: true,
  username: pickBotName(players.map((p) => p.username)),
  points: 0,
  streak: 0,
  bot: difficulty,
})
