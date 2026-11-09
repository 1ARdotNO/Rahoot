import { QuizzSummary } from "@rahoot/common/types/game"
import {
  accentFor,
  plural,
  TYPE_META,
} from "@rahoot/web/components/manager/meta"
import { formatRelative } from "@rahoot/web/utils/formatDate"
import clsx from "clsx"

type Props = {
  quizz: QuizzSummary
  selected: boolean
  onSelect: () => void
  onEdit: () => void
  onDelete: () => void
}

const QuizCard = ({ quizz, selected, onSelect, onEdit, onDelete }: Props) => {
  const accent = accentFor(quizz.id)

  return (
    <div
      role="button"
      tabIndex={0}
      aria-pressed={selected}
      onClick={onSelect}
      onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && onSelect()}
      className={clsx(
        "group relative flex flex-col overflow-hidden rounded-2xl bg-white text-left shadow-lg shadow-black/20 transition",
        selected
          ? "ring-primary scale-[1.01] ring-4"
          : "hover:-translate-y-0.5 hover:shadow-xl",
      )}
    >
      <div className={clsx("h-2", accent.bg)} />

      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start gap-3">
          <div
            className={clsx(
              "flex h-11 w-11 shrink-0 items-center justify-center rounded-xl text-lg font-extrabold",
              accent.soft,
            )}
          >
            {quizz.subject.trim().slice(0, 1).toUpperCase() || "?"}
          </div>
          <h3 className="line-clamp-2 min-w-0 flex-1 text-lg leading-snug font-bold text-gray-900">
            {quizz.subject}
          </h3>
          {selected && (
            <span className="bg-primary flex h-7 w-7 shrink-0 items-center justify-center rounded-full font-bold text-white">
              ✓
            </span>
          )}
        </div>

        <div className="mt-4 text-sm text-gray-500">
          {plural(quizz.questionCount, "question")}
          {quizz.slideCount > 0 && ` · ${plural(quizz.slideCount, "slide")}`}
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {quizz.types.map((type) => (
            <span
              key={type}
              title={TYPE_META[type].label}
              className="rounded-md bg-gray-100 px-2 py-0.5 text-xs font-semibold text-gray-600"
            >
              <span className="mr-1">{TYPE_META[type].icon}</span>
              {TYPE_META[type].label}
            </span>
          ))}
        </div>

        <div className="mt-auto flex items-center justify-between pt-5">
          <span className="text-xs text-gray-400">
            Edited {formatRelative(quizz.updatedAt)}
          </span>
          <div className="flex gap-1 opacity-100 transition md:opacity-0 md:group-focus-within:opacity-100 md:group-hover:opacity-100">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onEdit()
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-blue-600 hover:bg-blue-50"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete()
              }}
              className="rounded-lg px-3 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default QuizCard
