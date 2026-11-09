import AnswerButton from "@rahoot/web/components/AnswerButton"
import Button from "@rahoot/web/components/Button"
import { ANSWERS_COLORS, ANSWERS_ICONS } from "@rahoot/web/utils/constants"
import clsx from "clsx"
import { useState } from "react"

type Props = {
  answers: string[]
  multiple: boolean
  onSubmit?: (_answer: number | number[]) => void
}

const ChoiceAnswers = ({ answers, multiple, onSubmit }: Props) => {
  const [selected, setSelected] = useState<number[]>([])

  const handleClick = (key: number) => () => {
    if (!onSubmit) {
      return
    }

    if (!multiple) {
      onSubmit(key)

      return
    }

    setSelected((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key],
    )
  }

  return (
    <div className="mx-auto mb-4 flex w-full max-w-7xl flex-col gap-2 px-2">
      <div className="grid grid-cols-2 gap-1 rounded-full text-lg font-bold text-white md:text-xl">
        {answers.map((answer, key) => (
          <AnswerButton
            key={key}
            className={clsx(ANSWERS_COLORS[key], {
              "ring-4 ring-white ring-inset": selected.includes(key),
              "opacity-60":
                multiple && selected.length > 0 && !selected.includes(key),
            })}
            icon={ANSWERS_ICONS[key]}
            onClick={handleClick(key)}
            aria-pressed={multiple ? selected.includes(key) : undefined}
          >
            {multiple && onSubmit && (
              <span className="mr-2">{selected.includes(key) ? "☑" : "☐"}</span>
            )}
            {answer}
          </AnswerButton>
        ))}
      </div>

      {multiple && onSubmit && (
        <Button
          className="w-full"
          disabled={selected.length === 0}
          onClick={() => onSubmit(selected)}
        >
          Submit {selected.length > 0 ? `(${selected.length})` : ""}
        </Button>
      )}
    </div>
  )
}

export default ChoiceAnswers
