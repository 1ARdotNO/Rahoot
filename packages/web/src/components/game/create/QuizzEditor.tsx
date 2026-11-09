"use client"

import { QuestionType, Quizz, QuizzWithId } from "@rahoot/common/types/game"
import Button from "@rahoot/web/components/Button"
import {
  buildQuizz,
  DraftItem,
  DraftQuestion,
  makeQuestion,
  makeSlide,
  toDraft,
} from "@rahoot/web/components/game/create/editor/draft"
import ImageField from "@rahoot/web/components/game/create/editor/ImageField"
import QuestionFields from "@rahoot/web/components/game/create/editor/QuestionFields"
import SlideFields from "@rahoot/web/components/game/create/editor/SlideFields"
import SlidePreview from "@rahoot/web/components/game/create/editor/SlidePreview"
import { plural, TYPE_META } from "@rahoot/web/components/manager/meta"
import { Card } from "@rahoot/web/components/manager/ui"
import clsx from "clsx"
import { useState } from "react"
import toast from "react-hot-toast"

type Props = {
  initial?: QuizzWithId | null
  onSave: (_data: {
    id?: string
    quizz: Quizz
    images: { questionIndex: number; data: string }[]
  }) => void
  onCancel: () => void
}

const itemTitle = (item: DraftItem) =>
  item.type === "slide"
    ? item.title || "Untitled slide"
    : item.question || "Untitled question"

const OutlineButton = ({
  label,
  onClick,
  disabled,
  children,
}: {
  label: string
  onClick: () => void
  disabled?: boolean
  children: string
}) => (
  <button
    type="button"
    title={label}
    aria-label={label}
    disabled={disabled}
    onClick={(e) => {
      e.stopPropagation()
      onClick()
    }}
    className="rounded px-1.5 text-gray-400 hover:bg-gray-200 hover:text-gray-700 disabled:opacity-25"
  >
    {children}
  </button>
)

const QuizzEditor = ({ initial, onSave, onCancel }: Props) => {
  const [subject, setSubject] = useState(initial?.subject ?? "")
  const [items, setItems] = useState<DraftItem[]>(() =>
    initial?.questions?.length
      ? initial.questions.map(toDraft)
      : [makeQuestion("single")],
  )
  const [selectedKey, setSelectedKey] = useState(() => items[0].key)
  const [dirty, setDirty] = useState(false)

  const selectedIndex = Math.max(
    0,
    items.findIndex((item) => item.key === selectedKey),
  )
  const selected = items[selectedIndex]

  const change = (next: (_prev: DraftItem[]) => DraftItem[]) => {
    setItems(next)
    setDirty(true)
  }

  const updateSelected = (update: Partial<DraftItem>) =>
    change((prev) =>
      prev.map((item) =>
        item.key === selected.key
          ? ({ ...item, ...update } as DraftItem)
          : item,
      ),
    )

  const addItem = (item: DraftItem) => {
    // New items go right after the current one, where the author is working.
    change((prev) => [
      ...prev.slice(0, selectedIndex + 1),
      item,
      ...prev.slice(selectedIndex + 1),
    ])
    setSelectedKey(item.key)
  }

  const moveItem = (index: number, delta: number) =>
    change((prev) => {
      const target = index + delta

      if (target < 0 || target >= prev.length) {
        return prev
      }

      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]

      return next
    })

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      toast.error("A quiz needs at least one item")

      return
    }

    const neighbour = items[index + 1] ?? items[index - 1]
    change((prev) => prev.filter((_, i) => i !== index))

    if (items[index].key === selected.key) {
      setSelectedKey(neighbour.key)
    }
  }

  const handleSave = () => {
    const result = buildQuizz(subject, items)

    if (!result.ok) {
      toast.error(result.error)

      return
    }

    onSave({ id: initial?.id, quizz: result.quizz, images: result.images })
  }

  const handleCancel = () => {
    // eslint-disable-next-line no-alert
    if (!dirty || window.confirm("Discard your unsaved changes?")) {
      onCancel()
    }
  }

  let questionNumber = 0
  const numbers: (number | null)[] = []

  for (const item of items) {
    if (item.type === "slide") {
      numbers.push(null)
    } else {
      questionNumber += 1
      numbers.push(questionNumber)
    }
  }

  return (
    <div>
      <div className="bg-secondary/90 sticky top-[69px] z-20 mb-6 rounded-2xl border border-white/10 p-3 shadow-lg shadow-black/20 backdrop-blur">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleCancel}
            className="rounded-full px-3 py-2 text-sm font-semibold text-white/70 hover:bg-white/10 hover:text-white"
          >
            ← Back
          </button>
          <input
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value)
              setDirty(true)
            }}
            placeholder="Quiz title"
            aria-label="Quiz title"
            className="focus:ring-primary order-last w-full min-w-0 rounded-xl bg-white/10 px-4 py-2 text-xl font-bold text-white placeholder-white/40 outline-none focus:ring-2 sm:order-none sm:w-auto sm:flex-1 md:text-2xl"
          />
          <span className="hidden text-sm text-white/50 md:inline">
            {plural(questionNumber, "question")} ·{" "}
            {plural(items.length - questionNumber, "slide")}
            {dirty && " · unsaved"}
          </span>
          <Button onClick={handleSave} className="ml-auto px-6 sm:ml-0">
            {initial ? "Save" : "Create quiz"}
          </Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] xl:grid-cols-[20rem_minmax(0,1fr)]">
        <aside className="min-w-0 lg:sticky lg:top-40 lg:max-h-[calc(100dvh-11rem)] lg:self-start">
          <Card className="flex max-h-full flex-col overflow-hidden">
            <div className="border-b border-gray-100 px-4 py-3 text-xs font-bold tracking-wide text-gray-500 uppercase">
              Outline
            </div>
            <ol className="max-h-72 overflow-y-auto p-2 lg:max-h-none lg:flex-1">
              {items.map((item, index) => {
                const isSlide = item.type === "slide"
                const isSelected = item.key === selected.key

                return (
                  <li key={item.key}>
                    <div
                      role="button"
                      tabIndex={0}
                      onClick={() => setSelectedKey(item.key)}
                      onKeyDown={(e) =>
                        e.key === "Enter" && setSelectedKey(item.key)
                      }
                      className={clsx(
                        "group flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition",
                        isSelected
                          ? "ring-primary bg-orange-50 ring-2"
                          : "hover:bg-gray-50",
                      )}
                    >
                      <span
                        className={clsx(
                          "flex h-7 w-9 shrink-0 items-center justify-center rounded-md text-xs font-bold text-white",
                          isSlide ? "bg-violet-500" : "bg-gray-700",
                        )}
                        title={TYPE_META[item.type].label}
                      >
                        {isSlide ? "¶" : `Q${numbers[index]}`}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate font-semibold text-gray-800">
                          {itemTitle(item)}
                        </span>
                        <span className="block text-xs text-gray-400">
                          {TYPE_META[item.type].label}
                        </span>
                      </span>
                      <span
                        className={clsx(
                          "flex shrink-0",
                          !isSelected && "lg:hidden lg:group-hover:flex",
                        )}
                      >
                        <OutlineButton
                          label="Move up"
                          disabled={index === 0}
                          onClick={() => moveItem(index, -1)}
                        >
                          ↑
                        </OutlineButton>
                        <OutlineButton
                          label="Move down"
                          disabled={index === items.length - 1}
                          onClick={() => moveItem(index, 1)}
                        >
                          ↓
                        </OutlineButton>
                        <OutlineButton
                          label="Remove"
                          onClick={() => removeItem(index)}
                        >
                          ✕
                        </OutlineButton>
                      </span>
                    </div>
                  </li>
                )
              })}
            </ol>
            <div className="grid grid-cols-2 gap-2 border-t border-gray-100 p-3">
              <button
                type="button"
                onClick={() => addItem(makeQuestion("single"))}
                className="rounded-lg bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600"
              >
                + Question
              </button>
              <button
                type="button"
                onClick={() => addItem(makeSlide())}
                className="rounded-lg bg-violet-500 px-3 py-2 text-sm font-semibold text-white hover:bg-violet-600"
              >
                + Slide
              </button>
            </div>
          </Card>
        </aside>

        <Card className="min-w-0 p-5 md:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span
              className={clsx(
                "rounded-lg px-3 py-1 text-sm font-bold text-white",
                selected.type === "slide" ? "bg-violet-500" : "bg-gray-700",
              )}
            >
              {selected.type === "slide"
                ? "Info slide"
                : `Question ${numbers[selectedIndex]} of ${questionNumber}`}
            </span>
            <span className="text-sm text-gray-400">
              Item {selectedIndex + 1} of {items.length}
            </span>
          </div>

          {selected.type === "slide" ? (
            <div className="grid gap-8 xl:grid-cols-2">
              <div className="space-y-5">
                <SlideFields slide={selected} onChange={updateSelected} />
                <ImageField
                  image={selected.image}
                  onChange={(image, imageFile) =>
                    updateSelected({ image, imageFile })
                  }
                />
              </div>
              <div className="hidden xl:block">
                <SlidePreview slide={selected} />
              </div>
            </div>
          ) : (
            <div className="grid gap-8 xl:grid-cols-[minmax(0,3fr)_minmax(0,2fr)]">
              <div className="space-y-5">
                <QuestionFields
                  item={selected as DraftQuestion}
                  onChange={updateSelected}
                  onTypeChange={(type: QuestionType) => {
                    const next = makeQuestion(type, selected)
                    change((prev) =>
                      prev.map((item) =>
                        item.key === selected.key ? next : item,
                      ),
                    )
                  }}
                />
              </div>
              <div>
                <ImageField
                  image={selected.image}
                  onChange={(image, imageFile) =>
                    updateSelected({ image, imageFile })
                  }
                />
              </div>
            </div>
          )}

          <div className="mt-8 flex justify-between border-t border-gray-100 pt-5">
            <button
              type="button"
              disabled={selectedIndex === 0}
              onClick={() => setSelectedKey(items[selectedIndex - 1].key)}
              className="rounded-lg px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            >
              ← Previous
            </button>
            <button
              type="button"
              disabled={selectedIndex === items.length - 1}
              onClick={() => setSelectedKey(items[selectedIndex + 1].key)}
              className="rounded-lg px-4 py-2 font-semibold text-gray-600 hover:bg-gray-100 disabled:opacity-30"
            >
              Next →
            </button>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default QuizzEditor
