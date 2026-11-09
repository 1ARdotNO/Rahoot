import { GameResult } from "@rahoot/common/types/game/results"

// Usernames and answers are player-typed; a leading = + - @ would run as a spreadsheet formula.
const cell = (value: string | number | null) => {
  let text = value === null ? "" : String(value)

  if (/^[=+\-@\t\r]/u.test(text)) {
    text = `'${text}`
  }

  return /[",\n\r]/u.test(text) ? `"${text.replace(/"/gu, '""')}"` : text
}

export const resultToCsv = (result: GameResult) => {
  const rounds = result.rounds.filter((r) => !r.skipped)
  const header = [
    "Rank",
    "Player",
    "Points",
    "Correct",
    ...rounds.flatMap((r) => [
      `Q${r.questionNumber}: ${r.question}`,
      `Q${r.questionNumber} points`,
    ]),
  ]
  const rows = result.players.map((player) => [
    player.rank,
    player.username,
    player.points,
    player.correct,
    ...rounds.flatMap((round) => {
      const answer = round.answers.find((a) => a.username === player.username)

      return [answer?.answer ?? null, answer?.points ?? 0]
    }),
  ])
  const answerKey = [
    "",
    "Correct answer",
    "",
    "",
    ...rounds.flatMap((r) => [r.correctAnswer, ""]),
  ]

  return [header, answerKey, ...rows]
    .map((row) => row.map(cell).join(","))
    .join("\r\n")
}

const BOM = String.fromCharCode(0xfeff)

export const downloadCsv = (result: GameResult) => {
  // BOM so Excel opens UTF-8 names (æøå, emoji) correctly.
  const blob = new Blob([`${BOM}${resultToCsv(result)}`], {
    type: "text/csv;charset=utf-8",
  })
  const url = URL.createObjectURL(blob)
  const link = document.createElement("a")
  const safeName = result.subject.replace(/[^\w-]+/gu, "_").slice(0, 50)

  link.href = url
  link.download = `${safeName}-${result.startedAt.slice(0, 10)}.csv`
  link.click()
  URL.revokeObjectURL(url)
}
