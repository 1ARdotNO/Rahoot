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
import ManagerPassword from "@rahoot/web/components/game/create/ManagerPassword"
import QuizzEditor from "@rahoot/web/components/game/create/QuizzEditor"
import ApiKeys from "@rahoot/web/components/game/create/ApiKeys"
import SelectQuizz from "@rahoot/web/components/game/create/SelectQuizz"
import ResultDetail from "@rahoot/web/components/game/results/ResultDetail"
import ResultsList from "@rahoot/web/components/game/results/ResultsList"
import { useEvent, useSocket } from "@rahoot/web/contexts/socketProvider"
import useManagerSession from "@rahoot/web/hooks/useManagerSession"
import { useManagerStore } from "@rahoot/web/stores/manager"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"

type EditorMode =
  | { type: "list" }
  | { type: "create" }
  | { type: "edit"; quizz: QuizzWithId }
  | { type: "results" }
  | { type: "apiKeys" }
  | { type: "result"; result: GameResult }

const Manager = () => {
  const { setGameId, setStatus } = useManagerStore()
  const router = useRouter()
  const { socket } = useSocket()

  const [isAuth, setIsAuth] = useState(false)
  const [quizzList, setQuizzList] = useState<QuizzSummary[]>([])
  const [editorMode, setEditorMode] = useState<EditorMode>({ type: "list" })
  const [results, setResults] = useState<GameResultSummary[] | null>(null)
  const session = useManagerSession(() => {
    setIsAuth(false)
    setQuizzList([])
    setEditorMode({ type: "list" })
  })

  useEvent("manager:quizzList", (quizzList) => {
    setIsAuth(true)
    setQuizzList(quizzList)
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
    toast.success("Quiz saved successfully")
    setEditorMode({ type: "list" })
  })

  useEvent("manager:quizzDeleted", () => {
    toast.success("Quiz deleted")
  })

  useEvent("manager:resultsList", (list) => {
    setResults(list)
    setEditorMode((mode) =>
      mode.type === "result" ? { type: "results" } : mode,
    )
  })

  useEvent("manager:resultData", (result) => {
    setEditorMode({ type: "result", result })
  })

  useEvent("manager:quizzData", (quizz) => {
    setEditorMode({ type: "edit", quizz })
  })

  const handleAuth = (password: string) => {
    socket?.emit("manager:auth", password)
  }

  const handleStartGame = (quizzId: string, options: GameOptions) => {
    socket?.emit("game:create", { quizzId, options })
  }

  const handleSave = (data: {
    id?: string
    quizz: Quizz
    images: { questionIndex: number; data: string }[]
  }) => {
    socket?.emit("manager:saveQuizz", data)
  }

  const handleEdit = (id: string) => {
    socket?.emit("manager:getQuizz", id)
  }

  const handleDelete = (id: string) => {
    socket?.emit("manager:deleteQuizz", id)
  }

  if (!isAuth) {
    return <ManagerPassword methods={session.methods} onSubmit={handleAuth} />
  }

  if (editorMode.type === "apiKeys") {
    return <ApiKeys onBack={() => setEditorMode({ type: "list" })} />
  }

  if (editorMode.type === "results") {
    return (
      <ResultsList
        results={results}
        onOpen={(id) => socket?.emit("manager:getResult", id)}
        onBack={() => setEditorMode({ type: "list" })}
      />
    )
  }

  if (editorMode.type === "result") {
    return (
      <ResultDetail
        result={editorMode.result}
        onBack={() => setEditorMode({ type: "results" })}
        onDelete={(id) => socket?.emit("manager:deleteResult", id)}
      />
    )
  }

  if (editorMode.type === "create") {
    return (
      <QuizzEditor
        onSave={handleSave}
        onCancel={() => setEditorMode({ type: "list" })}
      />
    )
  }

  if (editorMode.type === "edit") {
    return (
      <QuizzEditor
        initial={editorMode.quizz}
        onSave={handleSave}
        onCancel={() => setEditorMode({ type: "list" })}
      />
    )
  }

  return (
    <SelectQuizz
      userName={session.name}
      onLogout={session.logout}
      onShowApiKeys={
        session.canManageApiKeys
          ? () => setEditorMode({ type: "apiKeys" })
          : undefined
      }
      quizzList={quizzList}
      onSelect={handleStartGame}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={() => setEditorMode({ type: "create" })}
      onShowResults={() => {
        setResults(null)
        setEditorMode({ type: "results" })
        socket?.emit("manager:getResults")
      }}
    />
  )
}

export default Manager
