import { ManagerStatusDataMap } from "@rahoot/common/types/game/status"
import { playScoreCountUp } from "@rahoot/web/utils/scoreSound"
import { animate, AnimatePresence, motion } from "motion/react"
import { useEffect, useState } from "react"

type Props = {
  data: ManagerStatusDataMap["SHOW_LEADERBOARD"]
}

// Long enough for the count to be felt (and heard), short enough to keep the game moving.
export const COUNT_UP_S = 1.2

const AnimatedPoints = ({ from, to }: { from: number; to: number }) => {
  const [displayValue, setDisplayValue] = useState(from)

  useEffect(() => {
    // Ease-out cubic, matched by the tick spacing in scoreSound.
    const controls = animate(from, to, {
      duration: COUNT_UP_S,
      ease: [0.33, 1, 0.68, 1],
      onUpdate: (latest) => setDisplayValue(Math.round(latest)),
    })

    return () => controls.stop()
  }, [from, to])

  return <span className="drop-shadow-md">{displayValue}</span>
}

// Lands just after the rows finish re-ordering, so the joke matches what people see.
const COMMENTARY_DELAY_S = 2.4

const Leaderboard = ({
  data: { oldLeaderboard, leaderboard, commentary = [] },
}: Props) => {
  const [displayedLeaderboard, setDisplayedLeaderboard] =
    useState(oldLeaderboard)
  const [isAnimating, setIsAnimating] = useState(false)

  useEffect(() => {
    setDisplayedLeaderboard(oldLeaderboard)
    setIsAnimating(false)

    const anyGain = leaderboard.some(
      (player) =>
        player.points !==
        oldLeaderboard.find((old) => old.id === player.id)?.points,
    )

    const timer = setTimeout(() => {
      setIsAnimating(true)
      setDisplayedLeaderboard(leaderboard)

      if (anyGain) {
        playScoreCountUp(COUNT_UP_S)
      }
    }, 1600)

    return () => {
      clearTimeout(timer)
    }
  }, [oldLeaderboard, leaderboard])

  return (
    <section className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col items-center justify-center px-2">
      <h2 className="mb-6 text-5xl font-bold text-white drop-shadow-md">
        Leaderboard
      </h2>
      <div className="flex w-full flex-col gap-2">
        <AnimatePresence mode="popLayout">
          {displayedLeaderboard.map(({ id, username, points }) => (
            <motion.div
              key={id}
              layout
              initial={{ opacity: 0, y: 50 }}
              animate={{
                opacity: 1,
                y: 0,
              }}
              exit={{
                opacity: 0,
                y: 50,
                transition: { duration: 0.2 },
              }}
              transition={{
                layout: {
                  type: "spring",
                  stiffness: 350,
                  damping: 25,
                },
              }}
              className="bg-primary flex w-full justify-between rounded-md p-3 text-2xl font-bold text-white"
            >
              <span className="drop-shadow-md">{username}</span>
              {isAnimating ? (
                <AnimatedPoints
                  from={oldLeaderboard.find((u) => u.id === id)?.points || 0}
                  to={leaderboard.find((u) => u.id === id)?.points || 0}
                />
              ) : (
                <span className="drop-shadow-md">{points}</span>
              )}
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      <div className="mt-6 flex w-full flex-col items-center gap-3">
        {commentary.map((line, index) => (
          <motion.p
            key={line}
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              delay: COMMENTARY_DELAY_S + index * 0.8,
              type: "spring",
              stiffness: 300,
              damping: 18,
            }}
            className="max-w-3xl rounded-2xl bg-white px-5 py-3 text-center text-xl font-bold text-gray-800 shadow-lg md:text-2xl"
          >
            {line}
          </motion.p>
        ))}
      </div>
    </section>
  )
}

export default Leaderboard
