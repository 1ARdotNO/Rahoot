"use client"

import {
  GameOptions,
  Quizz,
  QuizzSummary,
  QuizzWithId,
} from "@rahoot/common/types/game"
import {
  GameResult,
  GameResultSummary,
} from "@rahoot/common/types/game/results"
import { STATUS } from "@rahoot/common/types/game/status"
import ApiKeys from "@rahoot/web/components/game/create/ApiKeys"
import ManagerPassword from "@rahoot/web/components/game/create/ManagerPassword"
import QuizzEditor from "@rahoot/web/components/game/create/QuizzEditor"
import ResultDetail from "@rahoot/web/components/game/results/ResultDetail"
import ResultsList from "@rahoot/web/components/game/results/ResultsList"
import ManagerShell, {
  ManagerTab,
} from "@rahoot/web/components/manager/ManagerShell"
import QuizzesView from "@rahoot/web/components/manager/QuizzesView"
import { useEvent, useSocket } from "@rahoot/web/contexts/socketProvider"
import useManagerSession from "@rahoot/web/hooks/useManagerSession"
import { useManagerStore } from "@rahoot/web/stores/manager"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

// Full-screen tasks that temporarily replace the tab content.
type Overlay =
  | { type: "create" }
  | { type: "edit"; quizz: QuizzWithId }
  | { type: "result"; result: GameResult }

const Manager = () => {
  const { setGameId, setStatus } = useManagerStore()
  const router = useRouter()
  const { socket } = useSocket()

  const [isAuth, setIsAuth] = useState(false)
  const [tab, setTab] = useState<ManagerTab>("quizzes")
  const [overlay, setOverlay] = useState<Overlay | null>(null)
  const [quizzList, setQuizzList] = useState<QuizzSummary[]>([])
  const [results, setResults] = useState<GameResultSummary[] | null>(null)
  const session = useManagerSession(() => {
    setIsAuth(false)
    setQuizzList([])
    setResults(null)
    setOverlay(null)
    setTab("quizzes")
  })

  useEffect(() => {
    if (isAuth) {
      socket?.emit("manager:getResults")
    }
  }, [isAuth, socket])

  // Views swap in place; without this a view opened from far down the page starts mid-scroll.
  useEffect(() => {
    window.scrollTo({ top: 0 })
  }, [tab, overlay])

  useEvent("manager:quizzList", (list) => {
    setIsAuth(true)
    setQuizzList(list)
  })

  useEvent("manager:gameCreated", ({ gameId, inviteCode }) => {
    setGameId(gameId)
    setStatus(STATUS.SHOW_ROOM, {
      text: "Waiting for the players",
      inviteCode,
    })
    router.push(`/game/manager/${gameId}`)
  })

  // ManagerPassword shows errors until login; after that this page owns them.
  const showError = (message: string) => {
    if (isAuth) {
      toast.error(message)
    }
  }

  useEvent("manager:errorMessage", showError)
  useEvent("game:errorMessage", showError)

  useEvent("manager:quizzSaved", () => {
    toast.success("Quiz saved")
    setOverlay(null)
  })

  useEvent("manager:quizzDeleted", () => {
    toast.success("Quiz deleted")
  })

  useEvent("manager:quizzData", (quizz) => {
    setOverlay({ type: "edit", quizz })
  })

  useEvent("manager:resultsList", (list) => {
    setResults(list)
    setOverlay((current) => (current?.type === "result" ? null : current))
  })

  useEvent("manager:resultData", (result) => {
    setOverlay({ type: "result", result })
  })

  const handleSave = (data: {
    id?: string
    quizz: Quizz
    images: { questionIndex: number; data: string }[]
  }) => {
    socket?.emit("manager:saveQuizz", data)
  }

  const openResult = (id: string) => socket?.emit("manager:getResult", id)

  const switchTab = (next: ManagerTab) => {
    setOverlay(null)
    setTab(next)

    if (next === "results") {
      socket?.emit("manager:getResults")
    }
  }

  if (!isAuth) {
    return (
      <ManagerPassword
        methods={session.methods}
        onSubmit={(password) => socket?.emit("manager:auth", password)}
      />
    )
  }

  let content = null

  if (overlay?.type === "create" || overlay?.type === "edit") {
    content = (
      <QuizzEditor
        initial={overlay.type === "edit" ? overlay.quizz : null}
        onSave={handleSave}
        onCancel={() => setOverlay(null)}
      />
    )
  } else if (overlay?.type === "result") {
    content = (
      <ResultDetail
        result={overlay.result}
        onBack={() => setOverlay(null)}
        onDelete={(id) => socket?.emit("manager:deleteResult", id)}
      />
    )
  } else if (tab === "results") {
    content = <ResultsList results={results} onOpen={openResult} />
  } else if (tab === "apiKeys" && session.canManageApiKeys) {
    content = <ApiKeys />
  } else {
    content = (
      <QuizzesView
        quizzList={quizzList}
        recent={results}
        onStart={(quizzId, options: GameOptions) =>
          socket?.emit("game:create", { quizzId, options })
        }
        onEdit={(id) => socket?.emit("manager:getQuizz", id)}
        onDelete={(id) => socket?.emit("manager:deleteQuizz", id)}
        onCreate={() => setOverlay({ type: "create" })}
        onOpenResult={(id) => {
          setTab("results")
          openResult(id)
        }}
      />
    )
  }

  return (
    <ManagerShell
      tab={overlay?.type === "create" || overlay?.type === "edit" ? null : tab}
      onTab={switchTab}
      userName={session.name}
      canManageApiKeys={session.canManageApiKeys}
      onLogout={session.logout}
    >
      {content}
    </ManagerShell>
  )
}

export default Manager
