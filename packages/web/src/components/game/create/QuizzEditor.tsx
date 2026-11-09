"use client"

import { QuestionType, Quizz, QuizzWithId } from "@rahoot/common/types/game"
import Button from "@rahoot/web/components/Button"
import Input from "@rahoot/web/components/Input"
import {
  buildQuizz,
  DraftItem,
  DraftQuestion,
  makeQuestion,
  makeSlide,
  QUESTION_TYPE_LABELS,
  toDraft,
} from "@rahoot/web/components/game/create/editor/draft"
import ImageField from "@rahoot/web/components/game/create/editor/ImageField"
import QuestionFields from "@rahoot/web/components/game/create/editor/QuestionFields"
import SlideFields from "@rahoot/web/components/game/create/editor/SlideFields"
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
    ? item.title || "(untitled slide)"
    : item.question || "(untitled)"

const IconButton = ({
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
    className="rounded px-1.5 text-gray-500 hover:bg-gray-200 disabled:opacity-30"
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
  const [expanded, setExpanded] = useState<string | null>(
    () => items[0]?.key ?? null,
  )

  const replaceItem = (key: string, next: DraftItem) =>
    setItems((prev) => prev.map((item) => (item.key === key ? next : item)))

  const updateItem = (key: string, update: Partial<DraftItem>) =>
    setItems((prev) =>
      prev.map((item) =>
        item.key === key ? ({ ...item, ...update } as DraftItem) : item,
      ),
    )

  const addItem = (item: DraftItem) => {
    setItems((prev) => [...prev, item])
    setExpanded(item.key)
  }

  const moveItem = (index: number, delta: number) =>
    setItems((prev) => {
      const target = index + delta

      if (target < 0 || target >= prev.length) {
        return prev
      }

      const next = [...prev]
      ;[next[index], next[target]] = [next[target], next[index]]

      return next
    })

  const removeItem = (key: string) => {
    if (items.length <= 1) {
      toast.error("Quiz must have at least one item")

      return
    }

    setItems((prev) => prev.filter((item) => item.key !== key))
  }

  const handleSave = () => {
    const result = buildQuizz(subject, items)

    if (!result.ok) {
      toast.error(result.error)

      return
    }

    onSave({ id: initial?.id, quizz: result.quizz, images: result.images })
  }

  let questionNumber = 0

  return (
    <div className="z-10 flex w-full max-w-2xl flex-col gap-4 rounded-md bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-bold">
        {initial ? "Edit Quiz" : "Create Quiz"}
      </h1>

      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-600">
          Quiz Title
        </label>
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="Enter quiz title..."
          className="w-full"
        />
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Items ({items.length})</h2>

        {items.map((item, index) => {
          const isSlide = item.type === "slide"
          const isOpen = expanded === item.key

          if (!isSlide) {
            questionNumber += 1
          }

          return (
            <div
              key={item.key}
              className={clsx(
                "overflow-hidden rounded-md border",
                isSlide ? "border-purple-200" : "border-gray-200",
              )}
            >
              <div
                role="button"
                tabIndex={0}
                onClick={() => setExpanded(isOpen ? null : item.key)}
                onKeyDown={(e) =>
                  e.key === "Enter" && setExpanded(isOpen ? null : item.key)
                }
                className={clsx(
                  "flex w-full cursor-pointer items-center gap-2 p-3 text-left font-semibold",
                  isOpen ? "bg-gray-100" : "hover:bg-gray-50",
                )}
              >
                <span
                  className={clsx(
                    "shrink-0 rounded px-2 py-0.5 text-xs text-white",
                    isSlide ? "bg-purple-500" : "bg-gray-500",
                  )}
                >
                  {isSlide ? "Slide" : `Q${questionNumber}`}
                </span>
                <span className="flex-1 truncate">{itemTitle(item)}</span>
                {!isSlide && (
                  <span className="hidden shrink-0 text-xs font-normal text-gray-400 sm:inline">
                    {QUESTION_TYPE_LABELS[item.type]}
                  </span>
                )}
                <IconButton
                  label="Move up"
                  disabled={index === 0}
                  onClick={() => moveItem(index, -1)}
                >
                  ↑
                </IconButton>
                <IconButton
                  label="Move down"
                  disabled={index === items.length - 1}
                  onClick={() => moveItem(index, 1)}
                >
                  ↓
                </IconButton>
                <IconButton label="Remove" onClick={() => removeItem(item.key)}>
                  ✕
                </IconButton>
              </div>

              {isOpen && (
                <div className="space-y-4 border-t border-gray-200 p-4">
                  {item.type === "slide" ? (
                    <SlideFields
                      slide={item}
                      onChange={(update) => updateItem(item.key, update)}
                    />
                  ) : (
                    <QuestionFields
                      item={item as DraftQuestion}
                      onChange={(update) => updateItem(item.key, update)}
                      onTypeChange={(type: QuestionType) =>
                        replaceItem(item.key, makeQuestion(type, item))
                      }
                    />
                  )}

                  <ImageField
                    image={item.image}
                    onChange={(image, imageFile) =>
                      updateItem(item.key, { image, imageFile })
                    }
                  />
                </div>
              )}
            </div>
          )
        })}

        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => addItem(makeQuestion("single"))}
            className="flex-1 rounded-md bg-green-500 px-3 py-2 text-sm font-semibold text-white hover:bg-green-600"
          >
            + Add Question
          </button>
          <button
            type="button"
            onClick={() => addItem(makeSlide())}
            className="flex-1 rounded-md bg-purple-500 px-3 py-2 text-sm font-semibold text-white hover:bg-purple-600"
          >
            + Add Info Slide
          </button>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 rounded-md border border-gray-300 p-2 text-lg font-semibold text-gray-600 hover:bg-gray-50"
        >
          Cancel
        </button>
        <Button onClick={handleSave} className="flex-1">
          {initial ? "Save Changes" : "Create Quiz"}
        </Button>
      </div>
    </div>
  )
}

export default QuizzEditor
