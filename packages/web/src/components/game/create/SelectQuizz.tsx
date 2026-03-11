import { QuizzWithId } from "@rahoot/common/types/game"
import Button from "@rahoot/web/components/Button"
import clsx from "clsx"
import React, { useState } from "react"
import toast from "react-hot-toast"

type Props = {
  quizzList: QuizzWithId[]
  onSelect: (_id: string) => void
  onEdit: (_id: string) => void
  onDelete: (_id: string) => void
  onCreate: () => void
}

const SelectQuizz = ({
  quizzList,
  onSelect,
  onEdit,
  onDelete,
  onCreate,
}: Props) => {
  const [selected, setSelected] = useState<string | null>(null)

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

    onSelect(selected)
  }

  const handleDelete = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    if (
      confirm(
        `Delete quiz "${quizzList.find((q) => q.id === id)?.subject}"?`,
      )
    ) {
      onDelete(id)
      if (selected === id) setSelected(null)
    }
  }

  const handleEdit = (id: string) => (e: React.MouseEvent) => {
    e.stopPropagation()
    onEdit(id)
  }

  return (
    <div className="z-10 flex w-full max-w-md flex-col gap-4 rounded-md bg-white p-4 shadow-sm">
      <div className="flex flex-col items-center justify-center">
        <h1 className="mb-2 text-2xl font-bold">Select a quizz</h1>
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
