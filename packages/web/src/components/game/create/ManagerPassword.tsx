import Button from "@rahoot/web/components/Button"
import logo from "@rahoot/web/assets/logo.svg"
import Input from "@rahoot/web/components/Input"
import { useEvent, useSocket } from "@rahoot/web/contexts/socketProvider"
import { AuthMethods } from "@rahoot/web/hooks/useManagerSession"
import Image from "next/image"
import { KeyboardEvent, useState } from "react"
import toast from "react-hot-toast"

const fieldLabel = ({ password, apiKeys }: AuthMethods) => {
  if (password && apiKeys) {
    return "Manager password or API key"
  }

  return password ? "Manager password" : "API key"
}

type Props = {
  methods: AuthMethods | null
  onSubmit: (_password: string) => void
}

const ManagerPassword = ({ methods, onSubmit }: Props) => {
  const { socketUrl } = useSocket()
  const [password, setPassword] = useState("")

  const handleSubmit = () => {
    onSubmit(password)
  }

  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === "Enter") {
      handleSubmit()
    }
  }

  useEvent("manager:errorMessage", (message) => {
    toast.error(message)
  })

  if (!methods) {
    return null
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center px-4">
      <Image
        src={logo}
        alt="Rahoot!"
        className="mb-8 h-16 w-auto md:h-20"
        priority
      />
      <div className="flex w-full max-w-sm flex-col gap-4 rounded-2xl bg-white p-6 shadow-lg shadow-black/30">
        <div>
          <h1 className="text-2xl font-extrabold">Manager</h1>
          <p className="text-sm text-gray-500">
            Log in to create quizzes and host games.
          </p>
        </div>
        {methods.oidc && socketUrl && (
          <a
            href={`${socketUrl.replace(/\/$/u, "")}/auth/login`}
            className="btn-shadow bg-primary rounded-md p-2 text-center text-lg font-semibold text-white"
          >
            Log in with {methods.oidc.name}
          </a>
        )}

        {methods.oidc && (methods.password || methods.apiKeys) && (
          <div className="flex items-center gap-2 text-sm text-gray-400">
            <div className="h-px flex-1 bg-gray-200" />
            or
            <div className="h-px flex-1 bg-gray-200" />
          </div>
        )}

        {(methods.password || methods.apiKeys) && (
          <>
            <Input
              type="password"
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={fieldLabel(methods)}
            />
            <Button onClick={handleSubmit}>Log in</Button>
          </>
        )}
      </div>
    </div>
  )
}

export default ManagerPassword
