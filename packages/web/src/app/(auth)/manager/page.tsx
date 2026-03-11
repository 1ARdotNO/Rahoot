"use client"

import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import { STATUS } from "@rahoot/common/types/game/status"
import ManagerPassword from "@rahoot/web/components/game/create/ManagerPassword"
import QuizzEditor from "@rahoot/web/components/game/create/QuizzEditor"
import SelectQuizz from "@rahoot/web/components/game/create/SelectQuizz"
import { useEvent, useSocket } from "@rahoot/web/contexts/socketProvider"
import { useManagerStore } from "@rahoot/web/stores/manager"
import { useRouter } from "next/navigation"
import { useState } from "react"
import toast from "react-hot-toast"

type EditorMode =
  | { type: "list" }
  | { type: "create" }
  | { type: "edit"; quizz: QuizzWithId }

const Manager = () => {
  const { setGameId, setStatus } = useManagerStore()
  const router = useRouter()
  const { socket } = useSocket()

  const [isAuth, setIsAuth] = useState(false)
  const [quizzList, setQuizzList] = useState<QuizzWithId[]>([])
  const [editorMode, setEditorMode] = useState<EditorMode>({ type: "list" })

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

  useEvent("manager:quizzSaved", () => {
    toast.success("Quiz saved successfully")
    setEditorMode({ type: "list" })
  })

  useEvent("manager:quizzDeleted", () => {
    toast.success("Quiz deleted")
  })

  useEvent("manager:quizzData", (quizz) => {
    setEditorMode({ type: "edit", quizz })
  })

  const handleAuth = (password: string) => {
    socket?.emit("manager:auth", password)
  }

  const handleStartGame = (quizzId: string) => {
    socket?.emit("game:create", quizzId)
  }

  const handleSave = (data: {
    id?: string
    quizz: Quizz
    images: { questionIndex: number; data: string; filename: string }[]
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
    return <ManagerPassword onSubmit={handleAuth} />
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
      quizzList={quizzList}
      onSelect={handleStartGame}
      onEdit={handleEdit}
      onDelete={handleDelete}
      onCreate={() => setEditorMode({ type: "create" })}
    />
  )
}

export default Manager
