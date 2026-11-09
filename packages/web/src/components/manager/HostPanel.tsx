import { GameOptions, QuizzSummary } from "@rahoot/common/types/game"
import { GameResultSummary } from "@rahoot/common/types/game/results"
import Button from "@rahoot/web/components/Button"
import { Card, Toggle } from "@rahoot/web/components/manager/ui"
import { accentFor, plural } from "@rahoot/web/components/manager/meta"
import { formatRelative } from "@rahoot/web/utils/formatDate"
import clsx from "clsx"

const OPTIONS: { key: keyof GameOptions; label: string; hint: string }[] = [
  {
    key: "shuffleQuestions",
    label: "Shuffle questions",
    hint: "Info slides stay in place",
  },
  {
    key: "shuffleAnswers",
    label: "Shuffle answers",
    hint: "For choice questions",
  },
  {
    key: "streakBonus",
    label: "Streak bonus",
    hint: "+100 per correct answer in a row",
  },
  {
    key: "saveResults",
    label: "Save results",
    hint: "Review every answer afterwards",
  },
]

type Props = {
  quizz: QuizzSummary | null
  options: GameOptions
  onOptions: (_options: GameOptions) => void
  onStart: () => void
  recent: GameResultSummary[] | null
  onOpenResult: (_id: string) => void
}

const HostPanel = ({
  quizz,
  options,
  onOptions,
  onStart,
  recent,
  onOpenResult,
}: Props) => (
  <div className="flex flex-col gap-6">
    <Card className="overflow-hidden">
      <div className="bg-secondary/5 border-b border-gray-100 p-5">
        <div className="text-xs font-bold tracking-wide text-gray-500 uppercase">
          Host a game
        </div>
        {quizz ? (
          <div className="mt-2 flex items-center gap-3">
            <span
              className={clsx(
                "h-10 w-1.5 shrink-0 rounded-full",
                accentFor(quizz.id).bg,
              )}
            />
            <div className="min-w-0">
              <div className="truncate text-lg font-bold">{quizz.subject}</div>
              <div className="text-sm text-gray-500">
                {plural(quizz.questionCount, "question")}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-2 text-gray-500">Pick a quiz to get started.</div>
        )}
      </div>

      <div className="p-2">
        {OPTIONS.map(({ key, label, hint }) => (
          <Toggle
            key={key}
            label={label}
            hint={hint}
            checked={options[key]}
            onChange={(checked) => onOptions({ ...options, [key]: checked })}
          />
        ))}
      </div>

      <div className="p-5 pt-2">
        <Button
          className={clsx("w-full py-3 text-xl", !quizz && "opacity-50")}
          disabled={!quizz}
          onClick={onStart}
        >
          Start game ▶
        </Button>
      </div>
    </Card>

    {recent && recent.length > 0 && (
      <div>
        <h2 className="mb-3 text-sm font-bold tracking-wide text-white/60 uppercase">
          Recent games
        </h2>
        <div className="flex flex-col gap-2">
          {recent.slice(0, 4).map((result) => (
            <button
              key={result.id}
              type="button"
              onClick={() => onOpenResult(result.id)}
              className="flex items-center justify-between gap-3 rounded-xl bg-white/5 px-4 py-3 text-left transition hover:bg-white/10"
            >
              <div className="min-w-0">
                <div className="truncate font-semibold text-white">
                  {result.subject}
                </div>
                <div className="text-xs text-white/50">
                  {formatRelative(result.startedAt)} ·{" "}
                  {plural(result.playerCount, "player")}
                </div>
              </div>
              {result.winner && (
                <span className="max-w-28 shrink-0 truncate text-sm text-white/80">
                  🏆 {result.winner}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>
    )}
  </div>
)

export default HostPanel
