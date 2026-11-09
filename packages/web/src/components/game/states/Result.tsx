"use client"

import { CommonStatusDataMap } from "@rahoot/common/types/game/status"
import CricleCheck from "@rahoot/web/components/icons/CricleCheck"
import CricleXmark from "@rahoot/web/components/icons/CricleXmark"
import { usePlayerStore } from "@rahoot/web/stores/player"
import { SFX_RESULTS_SOUND } from "@rahoot/web/utils/constants"
import { useEffect } from "react"
import useSound from "use-sound"

type Props = {
  data: CommonStatusDataMap["SHOW_RESULT"]
}

const Result = ({
  data: {
    correct,
    message,
    points,
    myPoints,
    rank,
    aheadOfMe,
    correctAnswer,
    streak,
    streakBonus,
  },
}: Props) => {
  const player = usePlayerStore()

  const [sfxResults] = useSound(SFX_RESULTS_SOUND, {
    volume: 0.2,
  })

  useEffect(() => {
    player.updatePoints(myPoints)

    sfxResults()
  }, [sfxResults])

  return (
    <section className="anim-show relative mx-auto flex w-full max-w-7xl flex-1 flex-col items-center justify-center">
      {correct ? (
        <CricleCheck className="aspect-square max-h-60 w-full" />
      ) : (
        <CricleXmark className="aspect-square max-h-60 w-full" />
      )}
      <h2 className="mt-1 text-4xl font-bold text-white drop-shadow-lg">
        {message}
      </h2>
      <p className="mt-1 text-xl font-bold text-white drop-shadow-lg">
        {`You are top ${rank}${aheadOfMe ? `, behind ${aheadOfMe}` : ""}`}
      </p>
      {points > 0 && (
        <span className="mt-2 rounded bg-black/40 px-4 py-2 text-2xl font-bold text-white drop-shadow-lg">
          +{points}
        </span>
      )}
      {streak >= 2 && (
        <span className="mt-2 rounded bg-orange-500 px-4 py-1 text-lg font-bold text-white drop-shadow-lg">
          🔥 {streak} answer streak
          {streakBonus > 0 && ` (+${streakBonus} bonus)`}
        </span>
      )}
      {!correct && correctAnswer && (
        <p className="mt-3 max-w-md px-4 text-center text-lg font-bold text-white drop-shadow-lg">
          Correct answer: {correctAnswer}
        </p>
      )}
    </section>
  )
}

export default Result
