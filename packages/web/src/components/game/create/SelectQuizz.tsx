import { GameOptions, QuizzSummary } from "@rahoot/common/types/game"
import Button from "@rahoot/web/components/Button"
import clsx from "clsx"
import React, { useState } from "react"
import toast from "react-hot-toast"

const OPTION_LABELS: { key: keyof GameOptions; label: string; hint: string }[] =
  [
    {
      key: "shuffleQuestions",
      label: "Shuffle questions",
      hint: "Info slides stay in place; questions shuffle within each section",
    },
    {
      key: "shuffleAnswers",
      label: "Shuffle answers",
      hint: "Randomise answer order for choice questions",
    },
    {
      key: "streakBonus",
      label: "Streak bonus",
      hint: "+100 per consecutive correct answer, up to +500",
    },
    {
      key: "saveResults",
      label: "Save results",
      hint: "Keep a record of every answer to review later",
    },
  ]

type Props = {
  userName: string | null
  onLogout: () => void
  onShowApiKeys?: () => void
  quizzList: QuizzSummary[]
  onSelect: (_id: string, _options: GameOptions) => void
  onEdit: (_id: string) => void
  onDelete: (_id: string) => void
  onCreate: () => void
  onShowResults: () => void
}

const SelectQuizz = ({
  userName,
  onLogout,
  onShowApiKeys,
  quizzList,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
  onShowResults,
}: Props) => {
  const [selected, setSelected] = useState<string | null>(null)
  const [options, setOptions] = useState<GameOptions>({
    shuffleQuestions: false,
    shuffleAnswers: false,
    streakBonus: false,
    saveResults: true,
  })

  const handleSelect = (id: string) => () => {
    if (selected === id) {
      setSelected(null)
    } else {
      setSelected(id)
    }
  }

  const handleSubmit = () => {
    if (!selected) {
      toast.error("Please select a quizz")

      return
    }

    onSelect(selected, options)
  }

  const handleDelete = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation()

    if (
      // eslint-disable-next-line no-alert
      window.confirm(
        `Delete quiz "${quizzList.find((q) => q.id === id)?.subject}"?`,
      )
    ) {
      onDelete(id)

      if (selected === id) {
        setSelected(null)
      }
    }
  }

  const handleEdit = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(id)
  }

  return (
    <div className="z-10 flex w-full max-w-md flex-col gap-4 rounded-md bg-white p-4 shadow-sm">
      {userName && (
        <div className="flex items-center justify-between text-sm text-gray-500">
          <span className="truncate">
            Signed in as <span className="font-semibold">{userName}</span>
          </span>
          <div className="flex shrink-0 gap-3">
            {onShowApiKeys && (
              <button
                type="button"
                onClick={onShowApiKeys}
                className="font-semibold text-gray-600 hover:text-gray-800"
              >
                🔑 API keys
              </button>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="shrink-0 font-semibold text-gray-600 hover:text-gray-800"
            >
              Log out
            </button>
          </div>
        </div>
      )}
      <div className="flex flex-col items-center justify-center">
        <div className="mb-2 flex w-full items-center justify-between">
          <h1 className="text-2xl font-bold">Select a quizz</h1>
          <button
            type="button"
            onClick={onShowResults}
            className="rounded-md px-2 py-1 text-sm font-semibold text-blue-600 hover:bg-blue-50"
          >
            📊 Results
          </button>
        </div>
        {quizzList.length === 0 && (
          <p className="py-4 text-center text-gray-500">
            No quizzes yet. Create your first one below!
          </p>
        )}
        <div className="w-full space-y-2">
          {quizzList.map((quizz) => (
            <button
              key={quizz.id}
              className={clsx(
                "flex w-full items-center justify-between rounded-md p-3 outline outline-gray-300",
              )}
              onClick={handleSelect(quizz.id)}
            >
              <span className="truncate">{quizz.subject}</span>

              <div className="flex items-center gap-2">
                <span
                  onClick={handleEdit(quizz.id)}
                  className="rounded px-2 py-0.5 text-xs font-semibold text-blue-500 hover:bg-blue-50"
                  title="Edit quiz"
                >
                  Edit
                </span>
                <span
                  onClick={handleDelete(quizz.id)}
                  className="rounded px-2 py-0.5 text-xs font-semibold text-red-500 hover:bg-red-50"
                  title="Delete quiz"
                >
                  Delete
                </span>
                <div
                  className={clsx(
                    "h-5 w-5 rounded outline outline-offset-3 outline-gray-300",
                    selected === quizz.id &&
                      "bg-primary border-primary/80 shadow-inset",
                  )}
                ></div>
              </div>
            </button>
          ))}
        </div>
      </div>
      <fieldset className="rounded-md border border-gray-200 p-3">
        <legend className="px-1 text-sm font-semibold text-gray-600">
          Game options
        </legend>
        {OPTION_LABELS.map(({ key, label, hint }) => (
          <label
            key={key}
            className="flex cursor-pointer items-start gap-2 py-1"
          >
            <input
              type="checkbox"
              checked={options[key]}
              onChange={(e) =>
                setOptions((prev) => ({ ...prev, [key]: e.target.checked }))
              }
              className="accent-primary mt-1 h-4 w-4"
            />
            <span>
              <span className="font-semibold">{label}</span>
              <span className="block text-xs text-gray-500">{hint}</span>
            </span>
          </label>
        ))}
      </fieldset>
      <div className="flex gap-3">
        <button
          onClick={onCreate}
          className="flex-1 rounded-md border-2 border-dashed border-gray-300 p-2 text-lg font-semibold text-gray-500 hover:border-gray-400 hover:text-gray-600"
        >
          + Create Quiz
        </button>
        <Button onClick={handleSubmit} className="flex-1">
          Start Game
        </Button>
      </div>
    </div>
  )
}

export default SelectQuizz
