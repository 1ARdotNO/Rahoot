import { GameResult } from "@rahoot/common/types/game/results"
import Button from "@rahoot/web/components/Button"
import { downloadCsv } from "@rahoot/web/utils/resultsCsv"
import { formatDateTime } from "@rahoot/web/utils/formatDate"
import clsx from "clsx"
import { useState } from "react"

type Props = {
  result: GameResult
  onBack: () => void
  onDelete: (_id: string) => void
}

const OPTION_LABELS: [keyof GameResult["options"], string][] = [
  ["shuffleQuestions", "Shuffled questions"],
  ["shuffleAnswers", "Shuffled answers"],
  ["streakBonus", "Streak bonus"],
]

const ResultDetail = ({ result, onBack, onDelete }: Props) => {
  const [openRound, setOpenRound] = useState<number | null>(null)
  const activeOptions = OPTION_LABELS.filter(([key]) => result.options[key])

  const handleDelete = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Delete results for "${result.subject}"?`)) {
      onDelete(result.id)
    }
  }

  return (
    <div className="z-10 flex w-full max-w-3xl flex-col gap-5 rounded-md bg-white p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="truncate text-2xl font-bold">{result.subject}</h1>
          <p className="text-sm text-gray-500">
            {formatDateTime(result.startedAt)}
            {!result.completed && " · Unfinished game"}
            {activeOptions.length > 0 &&
              ` · ${activeOptions.map(([, label]) => label).join(", ")}`}
          </p>
        </div>
        <button
          type="button"
          onClick={onBack}
          className="shrink-0 text-sm font-semibold text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      <section>
        <h2 className="mb-2 text-lg font-semibold">Ranking</h2>
        {result.players.length === 0 ? (
          <p className="text-gray-500">No players.</p>
        ) : (
          <table className="w-full text-left">
            <thead className="border-b-2 border-gray-200 text-sm text-gray-500">
              <tr>
                <th className="py-1 pr-2">#</th>
                <th className="py-1 pr-2">Player</th>
                <th className="py-1 pr-2 text-right">Correct</th>
                <th className="py-1 text-right">Points</th>
              </tr>
            </thead>
            <tbody>
              {result.players.map((player) => (
                <tr
                  key={`${player.rank}-${player.username}`}
                  className="border-b border-gray-100"
                >
                  <td className="py-1 pr-2 font-semibold">{player.rank}</td>
                  <td className="py-1 pr-2">{player.username}</td>
                  <td className="py-1 pr-2 text-right">
                    {player.correct}/
                    {result.rounds.filter((r) => !r.skipped).length}
                  </td>
                  <td className="py-1 text-right font-semibold">
                    {player.points}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold">Questions</h2>
        {result.rounds.map((round, index) => {
          const correctCount = round.answers.filter((a) => a.correct).length
          const percent =
            round.answers.length > 0
              ? Math.round((correctCount / round.answers.length) * 100)
              : 0
          const isOpen = openRound === index

          return (
            <div
              key={index}
              className="overflow-hidden rounded-md border border-gray-200"
            >
              <button
                type="button"
                disabled={round.skipped}
                onClick={() => setOpenRound(isOpen ? null : index)}
                className={clsx(
                  "flex w-full items-center gap-3 p-3 text-left",
                  isOpen ? "bg-gray-100" : "hover:bg-gray-50",
                )}
              >
                <span className="shrink-0 rounded bg-gray-500 px-2 py-0.5 text-xs font-semibold text-white">
                  Q{round.questionNumber}
                </span>
                <span className="flex-1 truncate font-semibold">
                  {round.question}
                </span>
                {round.skipped ? (
                  <span className="shrink-0 text-sm text-gray-400">
                    Skipped
                  </span>
                ) : (
                  <span
                    className={clsx(
                      "shrink-0 rounded px-2 py-0.5 text-sm font-semibold",
                      percent >= 50
                        ? "bg-green-100 text-green-800"
                        : "bg-red-100 text-red-800",
                    )}
                  >
                    {percent}% correct
                  </span>
                )}
              </button>

              {isOpen && (
                <div className="border-t border-gray-200 p-3">
                  <p className="mb-2 text-sm">
                    <span className="text-gray-500">Correct answer:</span>{" "}
                    <span className="font-semibold text-green-700">
                      {round.correctAnswer}
                    </span>
                  </p>
                  <ul className="space-y-1">
                    {round.answers.map((answer, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-5 shrink-0">
                          {answer.correct ? "✅" : "❌"}
                        </span>
                        <span className="w-32 shrink-0 truncate font-semibold">
                          {answer.username}
                        </span>
                        <span
                          className={clsx(
                            "flex-1 truncate",
                            answer.answer === null && "text-gray-400 italic",
                          )}
                        >
                          {answer.answer ?? "No answer"}
                        </span>
                        <span className="shrink-0 text-gray-500">
                          +{answer.points}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </section>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleDelete}
          className="rounded-md border border-red-200 px-4 py-2 font-semibold text-red-500 hover:bg-red-50"
        >
          Delete
        </button>
        <Button className="flex-1" onClick={() => downloadCsv(result)}>
          Download CSV
        </Button>
      </div>
    </div>
  )
}

export default ResultDetail
