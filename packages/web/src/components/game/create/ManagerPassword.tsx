import Button from "@rahoot/web/components/Button"
import Form from "@rahoot/web/components/Form"
import Input from "@rahoot/web/components/Input"
import { useEvent, useSocket } from "@rahoot/web/contexts/socketProvider"
import { AuthMethods } from "@rahoot/web/hooks/useManagerSession"
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
    <Form>
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
          <Button onClick={handleSubmit}>Submit</Button>
        </>
      )}
    </Form>
  )
}

export default ManagerPassword
