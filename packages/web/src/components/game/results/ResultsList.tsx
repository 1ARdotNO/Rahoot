import { GameResultSummary } from "@rahoot/common/types/game/results"
import { formatDateTime } from "@rahoot/web/utils/formatDate"

type Props = {
  results: GameResultSummary[] | null
  onOpen: (_id: string) => void
  onBack: () => void
}

const ResultsList = ({ results, onOpen, onBack }: Props) => (
  <div className="z-10 flex w-full max-w-2xl flex-col gap-4 rounded-md bg-white p-6 shadow-sm">
    <div className="flex items-center justify-between">
      <h1 className="text-2xl font-bold">Game results</h1>
      <button
        type="button"
        onClick={onBack}
        className="text-sm font-semibold text-gray-600 hover:text-gray-800"
      >
        ← Back
      </button>
    </div>

    {results === null && <p className="text-gray-500">Loading…</p>}

    {results?.length === 0 && (
      <p className="py-6 text-center text-gray-500">
        No games played yet. Results are saved automatically when you host a
        game.
      </p>
    )}

    <div className="space-y-2">
      {results?.map((result) => (
        <button
          key={result.id}
          type="button"
          onClick={() => onOpen(result.id)}
          className="flex w-full items-center justify-between gap-3 rounded-md p-3 text-left outline outline-gray-300 hover:bg-gray-50"
        >
          <div className="min-w-0">
            <div className="truncate font-semibold">{result.subject}</div>
            <div className="text-sm text-gray-500">
              {formatDateTime(result.startedAt)} · {result.playerCount}{" "}
              {result.playerCount === 1 ? "player" : "players"} ·{" "}
              {result.questionCount}{" "}
              {result.questionCount === 1 ? "question" : "questions"}
            </div>
          </div>
          <div className="shrink-0 text-right text-sm">
            {result.winner && <div>🏆 {result.winner}</div>}
            {!result.completed && (
              <span className="rounded bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                Unfinished
              </span>
            )}
          </div>
        </button>
      ))}
    </div>
  </div>
)

export default ResultsList
