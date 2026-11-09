import { ApiKeyInfo } from "@rahoot/common/types/game"
import Button from "@rahoot/web/components/Button"
import Input from "@rahoot/web/components/Input"
import { useEvent, useSocket } from "@rahoot/web/contexts/socketProvider"
import { agentInstructions } from "@rahoot/web/utils/agentInstructions"
import { formatDateTime } from "@rahoot/web/utils/formatDate"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

type Props = {
  onBack: () => void
}

const copy = async (text: string, what: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${what} copied`)
  } catch {
    toast.error("Couldn't copy, please select and copy manually")
  }
}

const ApiKeys = ({ onBack }: Props) => {
  const { socket, socketUrl } = useSocket()
  const [keys, setKeys] = useState<ApiKeyInfo[] | null>(null)
  const [label, setLabel] = useState("")
  const [newKey, setNewKey] = useState<string | null>(null)

  useEffect(() => {
    socket?.emit("manager:listApiKeys")
  }, [socket])

  useEvent("manager:apiKeys", setKeys)
  useEvent("manager:apiKeyCreated", ({ key }) => {
    setNewKey(key)
    setLabel("")
  })

  const handleCreate = () => {
    socket?.emit("manager:createApiKey", label || "AI assistant")
  }

  const handleRevoke = (key: ApiKeyInfo) => {
    const message = `Revoke "${key.label}"? Anything using it stops working.`

    // eslint-disable-next-line no-alert
    if (window.confirm(message)) {
      socket?.emit("manager:revokeApiKey", key.id)
    }
  }

  const instructions = agentInstructions(
    socketUrl ?? "<socket url>",
    newKey ?? "<YOUR_API_KEY>",
  )

  return (
    <div className="z-10 flex w-full max-w-2xl flex-col gap-4 rounded-md bg-white p-6 shadow-sm">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">API keys</h1>
        <button
          type="button"
          onClick={onBack}
          className="text-sm font-semibold text-gray-600 hover:text-gray-800"
        >
          ← Back
        </button>
      </div>

      <p className="text-sm text-gray-600">
        An API key logs in as you, with access to your quizzes and results.
        Paste it into the manager login field, or give it to an AI assistant
        with the instructions below so it can create quizzes for you. Keys
        can&apos;t create or revoke other keys.
      </p>

      {newKey && (
        <div className="rounded-md border-2 border-green-400 bg-green-50 p-3">
          <p className="mb-2 text-sm font-semibold text-green-800">
            Copy your new key now. It won&apos;t be shown again.
          </p>
          <div className="flex gap-2">
            <code className="flex-1 truncate rounded bg-white px-2 py-1 font-mono text-sm">
              {newKey}
            </code>
            <button
              type="button"
              onClick={() => copy(newKey, "Key")}
              className="rounded bg-green-600 px-3 text-sm font-semibold text-white"
            >
              Copy
            </button>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <Input
          value={label}
          maxLength={60}
          onChange={(e) => setLabel(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleCreate()}
          placeholder="Label, e.g. ChatGPT"
          className="flex-1"
        />
        <Button onClick={handleCreate}>Create key</Button>
      </div>

      <div className="space-y-2">
        {keys?.length === 0 && (
          <p className="text-center text-sm text-gray-500">No API keys yet.</p>
        )}
        {keys?.map((key) => (
          <div
            key={key.id}
            className="flex items-center justify-between gap-3 rounded-md p-3 outline outline-gray-300"
          >
            <div className="min-w-0">
              <div className="truncate font-semibold">{key.label}</div>
              <div className="text-xs text-gray-500">
                Created {formatDateTime(key.createdAt)} ·{" "}
                {key.lastUsedAt
                  ? `last used ${formatDateTime(key.lastUsedAt)}`
                  : "never used"}
              </div>
            </div>
            <button
              type="button"
              onClick={() => handleRevoke(key)}
              className="shrink-0 rounded px-2 py-1 text-sm font-semibold text-red-500 hover:bg-red-50"
            >
              Revoke
            </button>
          </div>
        ))}
      </div>

      <details className="rounded-md border border-gray-200">
        <summary className="cursor-pointer p-3 font-semibold">
          Instructions for your AI assistant
        </summary>
        <div className="border-t border-gray-200 p-3">
          <pre className="max-h-72 overflow-auto rounded bg-gray-100 p-3 text-xs whitespace-pre-wrap">
            {instructions}
          </pre>
          <button
            type="button"
            onClick={() => copy(instructions, "Instructions")}
            className="mt-2 text-sm font-semibold text-blue-600 hover:text-blue-800"
          >
            Copy instructions
          </button>
        </div>
      </details>
    </div>
  )
}

export default ApiKeys
