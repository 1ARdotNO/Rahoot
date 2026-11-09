import { CommonStatusDataMap } from "@rahoot/common/types/game/status"
import { ANSWERS_COLORS, ANSWERS_ICONS } from "@rahoot/web/utils/constants"
import clsx from "clsx"
import { createElement } from "react"

type Props = {
  data: CommonStatusDataMap["SHOW_PREPARED"]
}

const TYPE_HINTS: Record<string, string | null> = {
  single: null,
  multiple: "Select every correct answer",
  truefalse: "True or false?",
  typed: "Type your answer",
  slider: "Pick a number on the slider",
}

const Prepared = ({ data: { type, totalAnswers, questionNumber } }: Props) => (
  <section className="anim-show relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center">
    <h2 className="anim-show mb-6 text-center text-3xl font-bold text-white drop-shadow-lg md:text-4xl lg:text-5xl">
      Question #{questionNumber}
    </h2>

    {TYPE_HINTS[type] && (
      <p className="mb-14 rounded-full bg-black/40 px-5 py-2 text-xl font-bold text-white">
        {TYPE_HINTS[type]}
      </p>
    )}

    {totalAnswers > 0 ? (
      <div className="anim-quizz grid aspect-square w-60 grid-cols-2 gap-4 rounded-2xl bg-gray-700 p-5 md:w-60">
        {[...Array(totalAnswers)].map((_, key) => (
          <div
            key={key}
            className={clsx(
              "button shadow-inset flex aspect-square h-full w-full items-center justify-center rounded-2xl",
              ANSWERS_COLORS[key],
            )}
          >
            {createElement(ANSWERS_ICONS[key], { className: "h-10 md:h-14" })}
          </div>
        ))}
      </div>
    ) : (
      <div className="anim-quizz flex aspect-square w-60 items-center justify-center rounded-2xl bg-gray-700 p-5 text-7xl font-bold text-white">
        {type === "slider" ? "123" : "Aa"}
      </div>
    )}
  </section>
)

export default Prepared
