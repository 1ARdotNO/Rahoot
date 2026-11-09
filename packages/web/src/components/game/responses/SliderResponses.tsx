import { ManagerStatusDataMap } from "@rahoot/common/types/game/status"

type Props = {
  slider: NonNullable<ManagerStatusDataMap["SHOW_RESPONSES"]["slider"]>
}

const SliderResponses = ({
  slider: { min, max, solution, tolerance, guesses },
}: Props) => {
  const toPercent = (value: number) => ((value - min) / (max - min)) * 100
  const average =
    guesses.length > 0
      ? guesses.reduce((sum, g) => sum + g, 0) / guesses.length
      : null
  const bandStart = toPercent(Math.max(min, solution - tolerance))
  const bandEnd = toPercent(Math.min(max, solution + tolerance))

  return (
    <div className="mx-auto mb-10 flex w-full max-w-4xl flex-col gap-6 px-6 text-white">
      <div className="flex justify-center gap-4 text-xl font-bold">
        <span className="rounded-md bg-green-500 px-4 py-2 shadow-lg">
          Answer: {solution}
          {tolerance > 0 && ` (±${tolerance})`}
        </span>
        {average !== null && (
          <span className="rounded-md bg-black/50 px-4 py-2">
            Average guess: {Math.round(average * 100) / 100}
          </span>
        )}
      </div>

      <div className="relative h-12">
        <div className="absolute top-1/2 h-3 w-full -translate-y-1/2 rounded-full bg-white/60" />
        <div
          className="absolute top-1/2 h-5 -translate-y-1/2 rounded-full bg-green-500"
          style={{
            left: `${bandStart}%`,
            width: `max(${bandEnd - bandStart}%, 6px)`,
          }}
        />
        {guesses.map((guess, index) => (
          <div
            key={index}
            className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white bg-blue-500 opacity-80"
            style={{ left: `${toPercent(guess)}%` }}
          />
        ))}
        <div className="absolute -bottom-6 left-0 font-bold">{min}</div>
        <div className="absolute right-0 -bottom-6 font-bold">{max}</div>
      </div>
    </div>
  )
}

export default SliderResponses
