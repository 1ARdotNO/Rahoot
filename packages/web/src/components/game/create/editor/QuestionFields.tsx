import { QuestionType } from "@rahoot/common/types/game"
import Input from "@rahoot/web/components/Input"
import {
  DraftQuestion,
  QUESTION_TYPE_LABELS,
} from "@rahoot/web/components/game/create/editor/draft"
import { ANSWERS_COLORS } from "@rahoot/web/utils/constants"
import clsx from "clsx"

type Props = {
  item: DraftQuestion
  onChange: (_update: Partial<DraftQuestion>) => void
  onTypeChange: (_type: QuestionType) => void
}

const Label = ({ children }: { children: string }) => (
  <label className="mb-1 block text-sm font-semibold text-gray-600">
    {children}
  </label>
)

const NumberField = ({
  label,
  value,
  onChange,
  min,
  step = 1,
}: {
  label: string
  value: number
  onChange: (_value: number) => void
  min?: number
  step?: number | "any"
}) => (
  <div className="flex-1">
    <Label>{label}</Label>
    <Input
      type="number"
      value={Number.isFinite(value) ? value : ""}
      min={min}
      step={step}
      onChange={(e) => onChange(e.target.valueAsNumber)}
      className="w-full"
    />
  </div>
)

const ChoiceFields = ({
  item,
  onChange,
}: {
  item: Extract<DraftQuestion, { type: "single" | "multiple" }>
  onChange: Props["onChange"]
}) => {
  const isCorrect = (index: number) =>
    item.type === "single"
      ? item.solution === index
      : item.solutions.includes(index)

  const toggleCorrect = (index: number) => {
    if (item.type === "single") {
      onChange({ solution: index })

      return
    }

    onChange({
      solutions: isCorrect(index)
        ? item.solutions.filter((s) => s !== index)
        : [...item.solutions, index],
    })
  }

  const updateAnswer = (index: number, value: string) =>
    onChange({ answers: item.answers.map((a, i) => (i === index ? value : a)) })

  const removeAnswer = (index: number) => {
    const answers = item.answers.filter((_, i) => i !== index)
    const shift = (s: number) => (s > index ? s - 1 : s)

    if (item.type === "single") {
      onChange({
        answers,
        solution: item.solution === index ? 0 : shift(item.solution),
      })
    } else {
      onChange({
        answers,
        solutions: item.solutions.filter((s) => s !== index).map(shift),
      })
    }
  }

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <span className="text-sm font-semibold text-gray-600">
          Answers{" "}
          {item.type === "multiple" && (
            <span className="font-normal">(mark every correct one)</span>
          )}
        </span>
        {item.answers.length < 4 && (
          <button
            type="button"
            onClick={() => onChange({ answers: [...item.answers, ""] })}
            className="text-sm text-blue-500 hover:text-blue-600"
          >
            + Add Answer
          </button>
        )}
      </div>
      <div className="space-y-2">
        {item.answers.map((answer, index) => (
          <div key={index} className="flex items-center gap-2">
            <span
              className={clsx(
                "h-8 w-3 shrink-0 rounded",
                ANSWERS_COLORS[index],
              )}
            />
            <Input
              value={answer}
              onChange={(e) => updateAnswer(index, e.target.value)}
              placeholder={`Answer ${index + 1}`}
              className="flex-1"
            />
            <button
              type="button"
              onClick={() => toggleCorrect(index)}
              className={clsx(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 text-sm",
                isCorrect(index)
                  ? "border-green-500 bg-green-500 text-white"
                  : "border-gray-300 text-gray-300 hover:border-green-400",
              )}
              title="Mark as correct"
            >
              ✓
            </button>
            {item.answers.length > 2 && (
              <button
                type="button"
                onClick={() => removeAnswer(index)}
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-red-400 hover:text-red-600"
                title="Remove answer"
              >
                ✕
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

const TypeSpecificFields = ({
  item,
  onChange,
}: Omit<Props, "onTypeChange">) => {
  if (item.type === "single" || item.type === "multiple") {
    return <ChoiceFields item={item} onChange={onChange} />
  }

  switch (item.type) {
    case "truefalse":
      return (
        <div>
          <Label>Correct answer</Label>
          <div className="flex gap-2">
            {[true, false].map((value) => (
              <button
                key={String(value)}
                type="button"
                onClick={() => onChange({ solution: value })}
                className={clsx(
                  "flex-1 rounded-md border-2 py-2 font-semibold",
                  item.solution === value
                    ? "border-green-500 bg-green-500 text-white"
                    : "border-gray-300 text-gray-500",
                )}
              >
                {value ? "True" : "False"}
              </button>
            ))}
          </div>
        </div>
      )

    case "typed":
      return (
        <div>
          <div className="mb-1 flex items-center justify-between">
            <span className="text-sm font-semibold text-gray-600">
              Accepted answers{" "}
              <span className="font-normal">(case-insensitive)</span>
            </span>
            <button
              type="button"
              onClick={() =>
                onChange({ acceptedAnswers: [...item.acceptedAnswers, ""] })
              }
              className="text-sm text-blue-500 hover:text-blue-600"
            >
              + Add alternative
            </button>
          </div>
          <div className="space-y-2">
            {item.acceptedAnswers.map((answer, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  value={answer}
                  onChange={(e) =>
                    onChange({
                      acceptedAnswers: item.acceptedAnswers.map((a, i) =>
                        i === index ? e.target.value : a,
                      ),
                    })
                  }
                  placeholder={index === 0 ? "Correct answer" : "Alternative"}
                  className="flex-1"
                />
                {item.acceptedAnswers.length > 1 && (
                  <button
                    type="button"
                    onClick={() =>
                      onChange({
                        acceptedAnswers: item.acceptedAnswers.filter(
                          (_, i) => i !== index,
                        ),
                      })
                    }
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded text-red-400 hover:text-red-600"
                    title="Remove alternative"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )

    default:
      return (
        <div className="space-y-2">
          <div className="flex gap-3">
            <NumberField
              label="Min"
              value={item.min}
              step="any"
              onChange={(min) => onChange({ min })}
            />
            <NumberField
              label="Max"
              value={item.max}
              step="any"
              onChange={(max) => onChange({ max })}
            />
            <NumberField
              label="Step"
              value={item.step}
              step="any"
              min={0}
              onChange={(step) => onChange({ step })}
            />
          </div>
          <div className="flex gap-3">
            <NumberField
              label="Correct value"
              value={item.solution}
              step="any"
              onChange={(solution) => onChange({ solution })}
            />
            <NumberField
              label="Tolerance (±)"
              value={item.tolerance}
              step="any"
              min={0}
              onChange={(tolerance) => onChange({ tolerance })}
            />
          </div>
          <p className="text-xs text-gray-500">
            Guesses within the tolerance count as correct. Others earn partial
            points, down to zero at a quarter of the range away.
          </p>
        </div>
      )
  }
}

const QuestionFields = ({ item, onChange, onTypeChange }: Props) => (
  <>
    <div className="flex flex-col gap-3 sm:flex-row">
      <div className="flex-1">
        <Label>Question</Label>
        <Input
          value={item.question}
          onChange={(e) => onChange({ question: e.target.value })}
          placeholder="Enter your question..."
          className="w-full"
        />
      </div>
      <div>
        <Label>Type</Label>
        <select
          value={item.type}
          onChange={(e) => onTypeChange(e.target.value as QuestionType)}
          className="h-11 rounded-sm bg-white px-2 font-semibold outline-2 outline-gray-300"
        >
          {Object.entries(QUESTION_TYPE_LABELS).map(([type, label]) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </select>
      </div>
    </div>

    <TypeSpecificFields item={item} onChange={onChange} />

    <div className="flex gap-4">
      <NumberField
        label="Read time before answering (s)"
        value={item.cooldown}
        min={1}
        onChange={(cooldown) => onChange({ cooldown })}
      />
      <NumberField
        label="Answer time (s)"
        value={item.time}
        min={1}
        onChange={(time) => onChange({ time })}
      />
    </div>
  </>
)

export default QuestionFields
