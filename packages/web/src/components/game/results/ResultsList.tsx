import { GameResultSummary } from "@rahoot/common/types/game/results"
import { accentFor, plural } from "@rahoot/web/components/manager/meta"
import {
  Card,
  EmptyState,
  PageHeader,
  Stat,
} from "@rahoot/web/components/manager/ui"
import { formatDateTime, formatRelative } from "@rahoot/web/utils/formatDate"
import clsx from "clsx"
import { useMemo, useState } from "react"

type Props = {
  results: GameResultSummary[] | null
  onOpen: (_id: string) => void
}

const ResultsList = ({ results, onOpen }: Props) => {
  const [search, setSearch] = useState("")
  const visible = useMemo(
    () =>
      (results ?? []).filter((r) =>
        r.subject.toLowerCase().includes(search.trim().toLowerCase()),
      ),
    [results, search],
  )
  const totalPlayers = (results ?? []).reduce(
    (sum, r) => sum + r.playerCount,
    0,
  )

  return (
    <div>
      <PageHeader
        title="Results"
        subtitle="Every game you host is saved here."
        actions={
          results && results.length > 3 ? (
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Filter by quiz…"
              className="focus:ring-primary w-56 rounded-full bg-white/10 px-4 py-2 text-white placeholder-white/40 outline-none focus:ring-2"
            />
          ) : null
        }
      />

      {results === null && <p className="text-white/60">Loading…</p>}

      {results?.length === 0 && (
        <EmptyState icon="📊" title="No games yet">
          Results are saved automatically when you host a game with “Save
          results” on.
        </EmptyState>
      )}

      {results && results.length > 0 && (
        <>
          <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4">
            <Stat label="Games" value={results.length} />
            <Stat label="Players" value={totalPlayers} />
            <Stat
              label="Avg. players"
              value={Math.round((totalPlayers / results.length) * 10) / 10}
            />
            <Stat
              label="Last game"
              value={formatRelative(results[0].startedAt)}
              accent="text-primary"
            />
          </div>

          <Card className="overflow-hidden">
            <table className="w-full text-left">
              <thead className="hidden bg-gray-50 text-xs font-bold tracking-wide text-gray-500 uppercase md:table-header-group">
                <tr>
                  <th className="px-5 py-3">Quiz</th>
                  <th className="px-5 py-3">Played</th>
                  <th className="px-5 py-3 text-right">Players</th>
                  <th className="px-5 py-3 text-right">Questions</th>
                  <th className="px-5 py-3">Winner</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {visible.map((result) => (
                  <tr
                    key={result.id}
                    onClick={() => onOpen(result.id)}
                    className="cursor-pointer transition hover:bg-orange-50/60"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <span
                          className={clsx(
                            "h-9 w-1.5 shrink-0 rounded-full",
                            accentFor(result.quizzId).bg,
                          )}
                        />
                        <div className="min-w-0">
                          <div className="truncate font-semibold text-gray-900">
                            {result.subject}
                          </div>
                          <div className="text-sm text-gray-500 md:hidden">
                            {formatRelative(result.startedAt)} ·{" "}
                            {plural(result.playerCount, "player")}
                            {result.winner && ` · 🏆 ${result.winner}`}
                          </div>
                        </div>
                        {!result.completed && (
                          <span className="shrink-0 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-semibold text-yellow-800">
                            Unfinished
                          </span>
                        )}
                      </div>
                    </td>
                    <td
                      className="hidden px-5 py-4 text-sm text-gray-600 md:table-cell"
                      title={formatDateTime(result.startedAt)}
                    >
                      {formatDateTime(result.startedAt)}
                    </td>
                    <td className="hidden px-5 py-4 text-right font-semibold md:table-cell">
                      {result.playerCount}
                    </td>
                    <td className="hidden px-5 py-4 text-right font-semibold md:table-cell">
                      {result.questionCount}
                    </td>
                    <td className="hidden max-w-48 truncate px-5 py-4 md:table-cell">
                      {result.winner ? `🏆 ${result.winner}` : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Card>
        </>
      )}
    </div>
  )
}

export default ResultsList
