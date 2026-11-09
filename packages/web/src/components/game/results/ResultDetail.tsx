import { GameResult, ResultRound } from "@rahoot/common/types/game/results"
import AnswerGrid from "@rahoot/web/components/game/results/AnswerGrid"
import { plural, TYPE_META } from "@rahoot/web/components/manager/meta"
import {
  Card,
  GhostButton,
  PageHeader,
  Stat,
} from "@rahoot/web/components/manager/ui"
import { formatDateTime } from "@rahoot/web/utils/formatDate"
import { downloadCsv } from "@rahoot/web/utils/resultsCsv"
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

const MEDALS = ["🥇", "🥈", "🥉"]

const correctRate = (round: ResultRound) =>
  round.answers.length === 0
    ? 0
    : round.answers.filter((a) => a.correct).length / round.answers.length

const rateColor = (rate: number) => {
  if (rate >= 0.7) {
    return "bg-green-500"
  }

  return rate >= 0.4 ? "bg-amber-400" : "bg-red-500"
}

const RoundRow = ({ round }: { round: ResultRound }) => {
  const [open, setOpen] = useState(false)
  const rate = correctRate(round)

  return (
    <div className="border-b border-gray-100 last:border-0">
      <button
        type="button"
        disabled={round.skipped}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center gap-4 px-5 py-4 text-left transition hover:bg-gray-50 disabled:cursor-default"
      >
        <span className="w-10 shrink-0 text-sm font-bold text-gray-400">
          Q{round.questionNumber}
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate font-semibold text-gray-900">
            {round.question}
          </span>
          <span className="text-xs text-gray-500">
            {TYPE_META[round.type].label}
            {!round.skipped && ` · Answer: ${round.correctAnswer}`}
          </span>
        </span>
        {round.skipped ? (
          <span className="shrink-0 rounded-full bg-gray-100 px-3 py-1 text-xs font-semibold text-gray-500">
            Skipped
          </span>
        ) : (
          <span className="flex w-36 shrink-0 items-center gap-2">
            <span className="h-2 flex-1 overflow-hidden rounded-full bg-gray-100">
              <span
                className={clsx("block h-full rounded-full", rateColor(rate))}
                style={{ width: `${Math.round(rate * 100)}%` }}
              />
            </span>
            <span className="w-10 text-right text-sm font-bold text-gray-700">
              {Math.round(rate * 100)}%
            </span>
          </span>
        )}
      </button>

      {open && (
        <ul className="grid gap-1 bg-gray-50 px-5 py-3 sm:grid-cols-2 2xl:grid-cols-3">
          {round.answers.map((answer, i) => (
            <li
              key={i}
              className="flex items-center gap-2 rounded-lg bg-white px-3 py-2 text-sm shadow-sm"
            >
              <span>{answer.correct ? "✅" : "❌"}</span>
              <span className="w-28 shrink-0 truncate font-semibold">
                {answer.username}
              </span>
              <span
                className={clsx(
                  "min-w-0 flex-1 truncate",
                  answer.answer === null && "text-gray-400 italic",
                )}
              >
                {answer.answer ?? "No answer"}
              </span>
              <span className="shrink-0 text-gray-500">+{answer.points}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

const ResultDetail = ({ result, onBack, onDelete }: Props) => {
  const scored = result.rounds.filter((r) => !r.skipped)
  const activeOptions = OPTION_LABELS.filter(([key]) => result.options[key])
  const averageRate =
    scored.length > 0
      ? scored.reduce((sum, r) => sum + correctRate(r), 0) / scored.length
      : 0
  const [hardest] = [...scored].sort((a, b) => correctRate(a) - correctRate(b))

  const handleDelete = () => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Delete results for "${result.subject}"?`)) {
      onDelete(result.id)
    }
  }

  return (
    <div>
      <button
        type="button"
        onClick={onBack}
        className="mb-4 text-sm font-semibold text-white/60 hover:text-white"
      >
        ← All results
      </button>

      <PageHeader
        title={result.subject}
        subtitle={
          <>
            {formatDateTime(result.startedAt)}
            {!result.completed && " · Unfinished game"}
            {activeOptions.map(([, label]) => ` · ${label}`).join("")}
          </>
        }
        actions={
          <>
            <button
              type="button"
              onClick={handleDelete}
              className="rounded-full px-4 py-2 text-sm font-semibold text-red-300 transition hover:bg-red-500/20"
            >
              Delete
            </button>
            <button
              type="button"
              onClick={() => downloadCsv(result)}
              className="bg-primary shadow-inset rounded-full px-5 py-2 font-bold text-white"
            >
              ⬇ Download CSV
            </button>
          </>
        }
      />

      <div className="mb-8 grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Stat label="Players" value={result.players.length} />
        <Stat label="Questions" value={scored.length} />
        <Stat
          label="Correct overall"
          value={`${Math.round(averageRate * 100)}%`}
          accent="text-green-600"
        />
        <Stat
          label="Hardest question"
          value={
            hardest
              ? `Q${hardest.questionNumber} · ${Math.round(correctRate(hardest) * 100)}%`
              : "—"
          }
          accent="text-red-500"
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[24rem_minmax(0,1fr)]">
        <Card className="self-start overflow-hidden">
          <h2 className="border-b border-gray-100 px-5 py-4 text-lg font-bold">
            Ranking
          </h2>
          {result.players.length === 0 && (
            <p className="p-5 text-gray-500">No players.</p>
          )}
          <ol>
            {result.players.map((player) => (
              <li
                key={`${player.rank}-${player.username}`}
                className={clsx(
                  "flex items-center gap-3 border-b border-gray-50 px-5 py-3 last:border-0",
                  player.rank <= 3 && "bg-amber-50/50",
                )}
              >
                <span className="w-8 text-center text-lg font-bold text-gray-400">
                  {MEDALS[player.rank - 1] ?? player.rank}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {player.username}
                    {player.bot && (
                      <span className="ml-1 text-xs font-normal text-gray-400">
                        bot
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500">
                    {player.correct}/{scored.length} correct
                  </span>
                </span>
                <span className="font-extrabold">{player.points}</span>
              </li>
            ))}
          </ol>
        </Card>

        <Card className="self-start overflow-hidden">
          <h2 className="border-b border-gray-100 px-5 py-4 text-lg font-bold">
            Questions{" "}
            <span className="font-normal text-gray-400">
              · click to see answers
            </span>
          </h2>
          {result.rounds.map((round, index) => (
            <RoundRow key={index} round={round} />
          ))}
        </Card>
      </div>

      {scored.length > 0 && result.players.length > 0 && (
        <Card className="mt-8 p-5">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-bold">Answer grid</h2>
            <span className="text-sm text-gray-500">
              {plural(result.players.length, "player")} ×{" "}
              {plural(scored.length, "question")} · hover for details
            </span>
          </div>
          <AnswerGrid result={result} />
        </Card>
      )}

      <div className="mt-6 text-right">
        <GhostButton
          className="text-white/50 hover:bg-white/10 hover:text-white"
          onClick={onBack}
        >
          ← Back to all results
        </GhostButton>
      </div>
    </div>
  )
}

export default ResultDetail
