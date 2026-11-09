"use client"

import { ActionResult } from "@rahoot/common/types/game"
import { Status, STATUS } from "@rahoot/common/types/game/status"
import background from "@rahoot/web/assets/background.webp"
import Button from "@rahoot/web/components/Button"
import Loader from "@rahoot/web/components/Loader"
import { useEvent, useSocket } from "@rahoot/web/contexts/socketProvider"
import { usePlayerStore } from "@rahoot/web/stores/player"
import { useQuestionStore } from "@rahoot/web/stores/question"
import { MANAGER_SKIP_BTN } from "@rahoot/web/utils/constants"
import clsx from "clsx"
import Image from "next/image"
import { PropsWithChildren, useEffect, useState } from "react"

type Props = PropsWithChildren & {
  statusName: Status | undefined
  // A new object per status update; back-to-back screens of the same kind (two slides) share a name.
  statusData?: unknown
  onNext?: () => Promise<ActionResult>
  onTogglePause?: () => Promise<ActionResult>
  onSkipQuestion?: () => Promise<ActionResult>
  manager?: boolean
}

const UNLOCK_AFTER_MS = 6000

const SKIPPABLE_STATUSES: Status[] = [
  STATUS.SHOW_PREPARED,
  STATUS.SHOW_QUESTION,
  STATUS.SELECT_ANSWER,
]

const GameWrapper = ({
  children,
  statusName,
  statusData,
  onNext,
  onTogglePause,
  onSkipQuestion,
  manager,
}: Props) => {
  const { isConnected } = useSocket()
  const { player } = usePlayerStore()
  const { questionStates, setQuestionStates, paused, setPaused } =
    useQuestionStore()
  const [isDisabled, setIsDisabled] = useState(false)
  const next = statusName ? MANAGER_SKIP_BTN[statusName] : null

  useEvent("game:updateQuestion", ({ current, total }) => {
    setQuestionStates({
      current,
      total,
    })
  })

  useEvent("game:paused", setPaused)

  useEffect(() => {
    setIsDisabled(false)
  }, [statusName, statusData])

  useEffect(() => {
    if (statusName !== STATUS.SELECT_ANSWER) {
      setPaused(false)
    }
  }, [statusName, setPaused])

  const canSkipQuestion =
    manager && statusName && SKIPPABLE_STATUSES.includes(statusName)
  const canPause = manager && statusName === STATUS.SELECT_ANSWER

  // Lock until the next screen arrives, but unlock at once if the server refused the action.
  const runLocked = async (action?: () => Promise<ActionResult>) => {
    if (!action || isDisabled) {
      return
    }

    setIsDisabled(true)
    const result = await action()

    if (!result.ok) {
      setIsDisabled(false)
    }
  }

  // Failsafe: an accepted action whose screen update got lost must not lock the host out.
  useEffect(() => {
    if (!isDisabled) {
      return undefined
    }

    const timer = setTimeout(() => setIsDisabled(false), UNLOCK_AFTER_MS)

    return () => clearTimeout(timer)
  }, [isDisabled])

  return (
    <section className="relative flex min-h-dvh w-full flex-col justify-between">
      <div className="fixed top-0 left-0 -z-10 h-full w-full bg-orange-600 opacity-70">
        <Image
          className="pointer-events-none h-full w-full object-cover opacity-60"
          src={background}
          alt="background"
        />
      </div>

      {!isConnected && !statusName ? (
        <div className="flex h-full w-full flex-1 flex-col items-center justify-center">
          <Loader />
          <h1 className="text-4xl font-bold text-white">Connecting...</h1>
        </div>
      ) : (
        <>
          <div className="relative z-50 flex w-full justify-between gap-2 p-4">
            {questionStates && (
              <div className="shadow-inset flex items-center rounded-md bg-white p-2 px-4 text-lg font-bold text-black">
                {`${questionStates.current} / ${questionStates.total}`}
              </div>
            )}

            <div className="ml-auto flex flex-wrap justify-end gap-2">
              {canPause && (
                <Button
                  className="bg-white px-4 text-black!"
                  onClick={onTogglePause}
                >
                  {paused ? "Resume" : "Pause"}
                </Button>
              )}

              {canSkipQuestion && (
                <Button
                  className={clsx("bg-white px-4 text-black!", {
                    "pointer-events-none": isDisabled,
                  })}
                  onClick={() => runLocked(onSkipQuestion)}
                >
                  Skip question
                </Button>
              )}

              {manager && next && (
                <Button
                  className={clsx("bg-white px-4 text-black!", {
                    "pointer-events-none": isDisabled,
                  })}
                  onClick={() => runLocked(onNext)}
                >
                  {next}
                </Button>
              )}
            </div>
          </div>

          {paused && (
            <div className="pointer-events-auto fixed inset-0 z-40 flex items-center justify-center bg-black/60">
              <div className="flex flex-col items-center gap-2 text-white">
                <span className="text-6xl font-bold drop-shadow-lg">
                  Paused
                </span>
                {!manager && (
                  <span className="text-lg">The host paused the game</span>
                )}
              </div>
            </div>
          )}

          {children}

          {!manager && (
            <div className="z-50 flex items-center justify-between bg-white px-4 py-2 text-lg font-bold text-white">
              <p className="text-gray-800">{player?.username}</p>
              <div className="rounded-sm bg-gray-800 px-3 py-1 text-lg">
                {player?.points}
              </div>
            </div>
          )}
        </>
      )}
    </section>
  )
}

export default GameWrapper
