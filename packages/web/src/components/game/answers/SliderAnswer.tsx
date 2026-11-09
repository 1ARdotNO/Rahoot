import { SliderConfig } from "@rahoot/common/types/game/status"
import Button from "@rahoot/web/components/Button"
import { useState } from "react"

type Props = {
  slider: SliderConfig
  onSubmit?: (_answer: number) => void
}

const snap = (value: number, { min, step }: SliderConfig) =>
  Number((min + Math.round((value - min) / step) * step).toFixed(6))

const SliderAnswer = ({ slider, onSubmit }: Props) => {
  const { min, max, step } = slider
  const [value, setValue] = useState(() => snap((min + max) / 2, slider))

  if (!onSubmit) {
    return (
      <div className="mx-auto mb-8 flex w-full max-w-3xl items-center gap-4 px-4 text-2xl font-bold text-white">
        <span>{min}</span>
        <div className="h-4 flex-1 rounded-full bg-white/60" />
        <span>{max}</span>
      </div>
    )
  }

  return (
    <div className="mx-auto mb-4 flex w-full max-w-xl flex-col gap-3 px-4">
      <div className="text-center text-5xl font-bold text-white drop-shadow-lg">
        {value}
      </div>
      <div className="flex items-center gap-3 font-bold text-white">
        <span>{min}</span>
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => setValue(Number(e.target.value))}
          className="accent-primary h-3 flex-1"
          aria-label="Your answer"
        />
        <span>{max}</span>
      </div>
      <Button onClick={() => onSubmit(value)}>Submit</Button>
    </div>
  )
}

export default SliderAnswer
