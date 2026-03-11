"use client"

import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import Button from "@rahoot/web/components/Button"
import Input from "@rahoot/web/components/Input"
import clsx from "clsx"
import {
  DragEvent,
  useCallback,
  useState,
} from "react"
import toast from "react-hot-toast"

type QuestionDraft = {
  question: string
  answers: string[]
  solution: number
  cooldown: number
  time: number
  image?: string
  imageFile?: { data: string; filename: string }
}

type Props = {
  initial?: QuizzWithId | null
  onSave: (data: {
    id?: string
    quizz: Quizz
    images: { questionIndex: number; data: string; filename: string }[]
  }) => void
  onCancel: () => void
}

const emptyQuestion = (): QuestionDraft => ({
  question: "",
  answers: ["", "", "", ""],
  solution: 0,
  cooldown: 5,
  time: 15,
})

const QuizzEditor = ({ initial, onSave, onCancel }: Props) => {
  const [subject, setSubject] = useState(initial?.subject || "")
  const [questions, setQuestions] = useState<QuestionDraft[]>(() => {
    if (initial?.questions?.length) {
      return initial.questions.map((q) => ({
        question: q.question,
        answers: [...q.answers],
        solution: q.solution,
        cooldown: q.cooldown,
        time: q.time,
        image: q.image,
      }))
    }
    return [emptyQuestion()]
  })
  const [expandedQuestion, setExpandedQuestion] = useState<number>(0)

  const updateQuestion = useCallback(
    (index: number, update: Partial<QuestionDraft>) => {
      setQuestions((prev) => {
        const next = [...prev]
        next[index] = { ...next[index], ...update }
        return next
      })
    },
    [],
  )

  const addQuestion = () => {
    setQuestions((prev) => [...prev, emptyQuestion()])
    setExpandedQuestion(questions.length)
  }

  const removeQuestion = (index: number) => {
    if (questions.length <= 1) {
      toast.error("Quiz must have at least one question")
      return
    }
    setQuestions((prev) => prev.filter((_, i) => i !== index))
    if (expandedQuestion >= index && expandedQuestion > 0) {
      setExpandedQuestion(expandedQuestion - 1)
    }
  }

  const updateAnswer = (qIndex: number, aIndex: number, value: string) => {
    setQuestions((prev) => {
      const next = [...prev]
      const answers = [...next[qIndex].answers]
      answers[aIndex] = value
      next[qIndex] = { ...next[qIndex], answers }
      return next
    })
  }

  const addAnswer = (qIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev]
      if (next[qIndex].answers.length >= 4) {
        toast.error("Maximum 4 answers per question")
        return prev
      }
      next[qIndex] = {
        ...next[qIndex],
        answers: [...next[qIndex].answers, ""],
      }
      return next
    })
  }

  const removeAnswer = (qIndex: number, aIndex: number) => {
    setQuestions((prev) => {
      const next = [...prev]
      if (next[qIndex].answers.length <= 2) {
        toast.error("Minimum 2 answers per question")
        return prev
      }
      const answers = next[qIndex].answers.filter((_, i) => i !== aIndex)
      let solution = next[qIndex].solution
      if (solution >= answers.length) {
        solution = 0
      } else if (aIndex < solution) {
        solution--
      }
      next[qIndex] = { ...next[qIndex], answers, solution }
      return next
    })
  }

  const handleImageDrop = (qIndex: number) => (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const file = e.dataTransfer.files[0]
    if (!file) return

    if (!file.type.startsWith("image/")) {
      toast.error("Only image files are supported")
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      toast.error("Image must be under 5MB")
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const base64 = (reader.result as string).split(",")[1]
      updateQuestion(qIndex, {
        image: reader.result as string,
        imageFile: { data: base64, filename: file.name },
      })
    }
    reader.readAsDataURL(file)
  }

  const handleImageSelect = (qIndex: number) => () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = "image/*"
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (!file) return

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image must be under 5MB")
        return
      }

      const reader = new FileReader()
      reader.onload = () => {
        const base64 = (reader.result as string).split(",")[1]
        updateQuestion(qIndex, {
          image: reader.result as string,
          imageFile: { data: base64, filename: file.name },
        })
      }
      reader.readAsDataURL(file)
    }
    input.click()
  }

  const removeImage = (qIndex: number) => {
    updateQuestion(qIndex, { image: undefined, imageFile: undefined })
  }

  const handleSave = () => {
    if (!subject.trim()) {
      toast.error("Please enter a quiz title")
      return
    }

    for (let i = 0; i < questions.length; i++) {
      const q = questions[i]
      if (!q.question.trim()) {
        toast.error(`Question ${i + 1} is empty`)
        return
      }
      const filledAnswers = q.answers.filter((a) => a.trim())
      if (filledAnswers.length < 2) {
        toast.error(`Question ${i + 1} needs at least 2 answers`)
        return
      }
      if (!q.answers[q.solution]?.trim()) {
        toast.error(`Question ${i + 1}: correct answer is empty`)
        return
      }
    }

    const images: { questionIndex: number; data: string; filename: string }[] =
      []
    const quizz: Quizz = {
      subject: subject.trim(),
      questions: questions.map((q, i) => {
        const answers = q.answers.filter((a) => a.trim())
        let solution = q.solution
        if (solution >= answers.length) solution = 0

        if (q.imageFile) {
          images.push({
            questionIndex: i,
            data: q.imageFile.data,
            filename: q.imageFile.filename,
          })
        }

        return {
          question: q.question.trim(),
          answers,
          solution,
          cooldown: q.cooldown,
          time: q.time,
          ...(q.image && !q.imageFile ? { image: q.image } : {}),
        }
      }),
    }

    onSave({ id: initial?.id, quizz, images })
  }

  const ANSWER_COLORS = [
    "bg-red-500",
    "bg-blue-500",
    "bg-yellow-500",
    "bg-green-500",
  ]
  const ANSWER_SHAPES = ["▲", "◆", "●", "■"]

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
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Questions ({questions.length})
          </h2>
          <button
            onClick={addQuestion}
            className="rounded-md bg-green-500 px-3 py-1 text-sm font-semibold text-white hover:bg-green-600"
          >
            + Add Question
          </button>
        </div>

        {questions.map((q, qIndex) => (
          <div
            key={qIndex}
            className="rounded-md border border-gray-200 overflow-hidden"
          >
            <button
              className={clsx(
                "flex w-full items-center justify-between p-3 text-left font-semibold",
                expandedQuestion === qIndex
                  ? "bg-gray-100"
                  : "hover:bg-gray-50",
              )}
              onClick={() =>
                setExpandedQuestion(
                  expandedQuestion === qIndex ? -1 : qIndex,
                )
              }
            >
              <span>
                Q{qIndex + 1}: {q.question || "(untitled)"}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-400">
                  {expandedQuestion === qIndex ? "▼" : "▶"}
                </span>
              </div>
            </button>

            {expandedQuestion === qIndex && (
              <div className="space-y-4 border-t border-gray-200 p-4">
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-600">
                    Question Text
                  </label>
                  <Input
                    value={q.question}
                    onChange={(e) =>
                      updateQuestion(qIndex, { question: e.target.value })
                    }
                    placeholder="Enter your question..."
                    className="w-full"
                  />
                </div>

                {/* Image drop zone */}
                <div>
                  <label className="mb-1 block text-sm font-semibold text-gray-600">
                    Image (optional)
                  </label>
                  {q.image ? (
                    <div className="relative">
                      <img
                        src={q.image}
                        alt="Question image"
                        className="max-h-48 w-full rounded-md border border-gray-200 object-contain"
                      />
                      <button
                        onClick={() => removeImage(qIndex)}
                        className="absolute top-2 right-2 rounded-full bg-red-500 px-2 py-0.5 text-sm font-bold text-white hover:bg-red-600"
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <div
                      onDrop={handleImageDrop(qIndex)}
                      onDragOver={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                      }}
                      onClick={handleImageSelect(qIndex)}
                      className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-8 text-gray-400 transition hover:border-gray-400 hover:text-gray-500"
                    >
                      <span className="text-3xl">📁</span>
                      <span className="mt-1 text-sm">
                        Drag & drop an image here, or click to browse
                      </span>
                    </div>
                  )}
                </div>

                {/* Answers */}
                <div>
                  <div className="mb-1 flex items-center justify-between">
                    <label className="text-sm font-semibold text-gray-600">
                      Answers
                    </label>
                    {q.answers.length < 4 && (
                      <button
                        onClick={() => addAnswer(qIndex)}
                        className="text-sm text-blue-500 hover:text-blue-600"
                      >
                        + Add Answer
                      </button>
                    )}
                  </div>
                  <div className="space-y-2">
                    {q.answers.map((answer, aIndex) => (
                      <div key={aIndex} className="flex items-center gap-2">
                        <span
                          className={clsx(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded text-white",
                            ANSWER_COLORS[aIndex],
                          )}
                        >
                          {ANSWER_SHAPES[aIndex]}
                        </span>
                        <Input
                          value={answer}
                          onChange={(e) =>
                            updateAnswer(qIndex, aIndex, e.target.value)
                          }
                          placeholder={`Answer ${aIndex + 1}`}
                          className="flex-1"
                        />
                        <button
                          onClick={() =>
                            updateQuestion(qIndex, { solution: aIndex })
                          }
                          className={clsx(
                            "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm",
                            q.solution === aIndex
                              ? "border-green-500 bg-green-500 text-white"
                              : "border-gray-300 text-gray-300 hover:border-green-400",
                          )}
                          title="Mark as correct answer"
                        >
                          ✓
                        </button>
                        {q.answers.length > 2 && (
                          <button
                            onClick={() => removeAnswer(qIndex, aIndex)}
                            className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-red-400 hover:text-red-600"
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                {/* Timing */}
                <div className="flex gap-4">
                  <div className="flex-1">
                    <label className="mb-1 block text-sm font-semibold text-gray-600">
                      Cooldown (seconds)
                    </label>
                    <Input
                      type="number"
                      min={1}
                      max={30}
                      value={q.cooldown}
                      onChange={(e) =>
                        updateQuestion(qIndex, {
                          cooldown: parseInt(e.target.value) || 1,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="mb-1 block text-sm font-semibold text-gray-600">
                      Answer Time (seconds)
                    </label>
                    <Input
                      type="number"
                      min={5}
                      max={120}
                      value={q.time}
                      onChange={(e) =>
                        updateQuestion(qIndex, {
                          time: parseInt(e.target.value) || 5,
                        })
                      }
                      className="w-full"
                    />
                  </div>
                </div>

                <button
                  onClick={() => removeQuestion(qIndex)}
                  className="w-full rounded-md border border-red-200 py-1 text-sm text-red-500 hover:bg-red-50"
                >
                  Remove Question
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="flex gap-3">
        <button
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
