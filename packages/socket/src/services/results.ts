import { GameResult, GameResultSummary } from "@rahoot/common/types/game/results"
import { getPath, ownerDir } from "@rahoot/socket/services/config"
import fs from "fs"

const SAFE_ID = /^[A-Za-z0-9_-]{1,64}$/u

const resultPath = (owner: string | null, id: string) => {
  if (!SAFE_ID.test(id)) {
    throw new Error("Invalid result id")
  }

  return getPath(`${ownerDir("results", owner)}/${id}.json`)
}

const summarize = (result: GameResult): GameResultSummary => ({
  id: result.id,
  quizzId: result.quizzId,
  subject: result.subject,
  startedAt: result.startedAt,
  completed: result.completed,
  playerCount: result.players.length,
  questionCount: result.rounds.filter((r) => !r.skipped).length,
  winner: result.players[0]?.username ?? null,
})

const Results = {
  save(owner: string | null, result: GameResult) {
    fs.mkdirSync(getPath(ownerDir("results", owner)), { recursive: true })
    fs.writeFileSync(resultPath(owner, result.id), JSON.stringify(result, null, 2))
  },

  get(owner: string | null, id: unknown): GameResult | null {
    if (typeof id !== "string" || !SAFE_ID.test(id)) {
      return null
    }

    const file = resultPath(owner, id)

    if (!fs.existsSync(file)) {
      return null
    }

    try {
      return JSON.parse(fs.readFileSync(file, "utf-8"))
    } catch (error) {
      console.error(`Failed to read result ${id}:`, error)

      return null
    }
  },

  list(owner: string | null): GameResultSummary[] {
    const dir = getPath(ownerDir("results", owner))

    if (!fs.existsSync(dir)) {
      return []
    }

    return fs
      .readdirSync(dir)
      .filter((file) => file.endsWith(".json"))
      .flatMap((file) => {
        const result = Results.get(owner, file.replace(/\.json$/u, ""))

        return result ? [summarize(result)] : []
      })
      .sort((a, b) => b.startedAt.localeCompare(a.startedAt))
  },

  delete(owner: string | null, id: unknown): boolean {
    if (typeof id !== "string" || !SAFE_ID.test(id)) {
      return false
    }

    const file = resultPath(owner, id)

    if (!fs.existsSync(file)) {
      return false
    }

    fs.unlinkSync(file)

    return true
  },
}

export default Results
