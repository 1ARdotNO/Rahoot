import { useEvent, useSocket } from "@rahoot/web/contexts/socketProvider"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

export type AuthMethods = {
  password: boolean
  apiKeys: boolean
  oidc: { name: string } | null
}

const STORAGE_KEY = "rahoot_manager_session"

const readToken = () => {
  try {
    return sessionStorage.getItem(STORAGE_KEY)
  } catch {
    return null
  }
}

const writeToken = (token: string | null) => {
  try {
    if (token) {
      sessionStorage.setItem(STORAGE_KEY, token)
    } else {
      sessionStorage.removeItem(STORAGE_KEY)
    }
  } catch {
    // Storage can be unavailable (private mode); login just won't survive a reload.
  }
}

const useManagerSession = (onSignedOut: () => void) => {
  const { socket } = useSocket()
  const [methods, setMethods] = useState<AuthMethods | null>(null)
  const [name, setName] = useState<string | null>(null)
  const [canManageApiKeys, setCanManageApiKeys] = useState(false)

  useEffect(() => {
    if (!socket) {
      return
    }

    socket.emit("manager:authMethods")

    // The OIDC callback lands here with a one-time code in the fragment.
    const hash = new URLSearchParams(window.location.hash.slice(1))
    const handoff = hash.get("handoff")
    const authError = hash.get("authError")

    if (handoff || authError) {
      window.history.replaceState(null, "", window.location.pathname)
    }

    if (authError) {
      toast.error(authError)
    }

    if (handoff) {
      socket.emit("manager:oidcHandoff", handoff)

      return
    }

    const token = readToken()

    if (token) {
      socket.emit("manager:resume", token)
    }
  }, [socket])

  // Server-side login state is per socket, so restore it after a reconnect.
  useEvent("connect", () => {
    const token = readToken()

    if (token) {
      socket?.emit("manager:resume", token)
    }
  })

  useEvent("manager:authMethods", setMethods)

  useEvent("manager:session", (session) => {
    if (session.token) {
      writeToken(session.token)
    }

    setName(session.name)
    setCanManageApiKeys(session.canManageApiKeys)
  })

  useEvent("manager:sessionExpired", () => {
    writeToken(null)
    setName(null)
    onSignedOut()
    toast.error("Your session expired, please log in again")
  })

  const logout = () => {
    socket?.emit("manager:logout", readToken() ?? undefined)
    writeToken(null)
    setName(null)
    onSignedOut()
  }

  return { methods, name, canManageApiKeys, logout }
}

export default useManagerSession
