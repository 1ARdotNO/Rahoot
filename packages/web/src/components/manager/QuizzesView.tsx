import { GameOptions, QuizzSummary } from "@rahoot/common/types/game"
import { GameResultSummary } from "@rahoot/common/types/game/results"
import Button from "@rahoot/web/components/Button"
import HostPanel from "@rahoot/web/components/manager/HostPanel"
import QuizCard from "@rahoot/web/components/manager/QuizCard"
import { EmptyState, PageHeader } from "@rahoot/web/components/manager/ui"
import { useMemo, useState } from "react"
import toast from "react-hot-toast"

type Props = {
  quizzList: QuizzSummary[]
  recent: GameResultSummary[] | null
  onStart: (_id: string, _options: GameOptions) => void
  onEdit: (_id: string) => void
  onDelete: (_id: string) => void
  onCreate: () => void
  onOpenResult: (_id: string) => void
}

const QuizzesView = ({
  quizzList,
  recent,
  onStart,
  onEdit,
  onDelete,
  onCreate,
  onOpenResult,
}: Props) => {
  const [selected, setSelected] = useState<string | null>(null)
  const [search, setSearch] = useState("")
  const [options, setOptions] = useState<GameOptions>({
    shuffleQuestions: false,
    shuffleAnswers: false,
    streakBonus: false,
    saveResults: true,
  })

  const visible = useMemo(
    () =>
      quizzList
        .filter((q) =>
          q.subject.toLowerCase().includes(search.trim().toLowerCase()),
        )
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [quizzList, search],
  )
  const selectedQuizz = quizzList.find((q) => q.id === selected) ?? null

  const handleDelete = (quizz: QuizzSummary) => {
    // eslint-disable-next-line no-alert
    if (window.confirm(`Delete quiz "${quizz.subject}"?`)) {
      onDelete(quizz.id)

      if (selected === quizz.id) {
        setSelected(null)
      }
    }
  }

  const handleStart = () => {
    if (!selected) {
      toast.error("Pick a quiz first")

      return
    }

    onStart(selected, options)
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] xl:grid-cols-[minmax(0,1fr)_24rem]">
      <section className="min-w-0 pb-24 lg:pb-0">
        <PageHeader
          title="Your quizzes"
          subtitle={`${quizzList.length} ${quizzList.length === 1 ? "quiz" : "quizzes"}`}
          actions={
            <>
              {quizzList.length > 3 && (
                <input
                  type="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search quizzes…"
                  className="focus:ring-primary w-56 rounded-full bg-white/10 px-4 py-2 text-white placeholder-white/40 outline-none focus:ring-2"
                />
              )}
              <Button onClick={onCreate} className="px-5">
                + New quiz
              </Button>
            </>
          }
        />

        {quizzList.length === 0 ? (
          <EmptyState icon="🧩" title="No quizzes yet">
            Create your first quiz to start hosting games.
          </EmptyState>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
            {visible.map((quizz) => (
              <QuizCard
                key={quizz.id}
                quizz={quizz}
                selected={selected === quizz.id}
                onSelect={() =>
                  setSelected(selected === quizz.id ? null : quizz.id)
                }
                onEdit={() => onEdit(quizz.id)}
                onDelete={() => handleDelete(quizz)}
              />
            ))}
            {visible.length === 0 && (
              <p className="col-span-full py-10 text-center text-white/60">
                No quizzes match “{search}”.
              </p>
            )}
          </div>
        )}
      </section>

      {selectedQuizz && (
        // On small screens the host panel sits below every card; keep Start in reach.
        <div className="bg-secondary/95 fixed inset-x-0 bottom-0 z-20 border-t border-white/10 p-3 backdrop-blur lg:hidden">
          <div className="mx-auto flex max-w-2xl items-center gap-3">
            <div className="min-w-0 flex-1">
              <div className="truncate font-bold text-white">
                {selectedQuizz.subject}
              </div>
              <a
                href="#host-panel"
                className="text-primary text-sm font-semibold"
              >
                Game options ↓
              </a>
            </div>
            <Button onClick={handleStart} className="shrink-0 px-5">
              Start ▶
            </Button>
          </div>
        </div>
      )}

      <aside
        id="host-panel"
        className="min-w-0 scroll-mt-24 lg:sticky lg:top-24 lg:self-start"
      >
        <HostPanel
          quizz={selectedQuizz}
          options={options}
          onOptions={setOptions}
          onStart={handleStart}
          recent={recent}
          onOpenResult={onOpenResult}
        />
      </aside>
    </div>
  )
}

export default QuizzesView
