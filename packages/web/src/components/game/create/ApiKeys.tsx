import { ApiKeyInfo } from "@rahoot/common/types/game"
import Button from "@rahoot/web/components/Button"
import Input from "@rahoot/web/components/Input"
import { Card, PageHeader } from "@rahoot/web/components/manager/ui"
import { useEvent, useSocket } from "@rahoot/web/contexts/socketProvider"
import { agentInstructions } from "@rahoot/web/utils/agentInstructions"
import { formatRelative } from "@rahoot/web/utils/formatDate"
import { useEffect, useState } from "react"
import toast from "react-hot-toast"

const copy = async (text: string, what: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success(`${what} copied`)
  } catch {
    toast.error("Couldn't copy, please select and copy manually")
  }
}

const ApiKeys = () => {
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
    <div>
      <PageHeader
        title="API keys"
        subtitle="Let scripts and AI assistants create quizzes on your behalf."
      />

      <div className="grid gap-8 xl:grid-cols-2">
        <div className="flex flex-col gap-6">
          <Card className="p-6">
            <h2 className="text-lg font-bold">Create a key</h2>
            <p className="mt-1 mb-4 text-sm text-gray-500">
              A key logs in as you, with access to your quizzes and results. It
              can&apos;t create or revoke other keys.
            </p>
            <div className="flex gap-2">
              <Input
                value={label}
                maxLength={60}
                onChange={(e) => setLabel(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                placeholder="Label, e.g. ChatGPT"
                className="min-w-0 flex-1"
              />
              <Button onClick={handleCreate} className="px-5">
                Create
              </Button>
            </div>

            {newKey && (
              <div className="mt-4 rounded-xl border-2 border-green-400 bg-green-50 p-4">
                <p className="mb-2 text-sm font-semibold text-green-800">
                  Copy your new key now. It won&apos;t be shown again.
                </p>
                <div className="flex gap-2">
                  <code className="min-w-0 flex-1 truncate rounded-lg bg-white px-3 py-2 font-mono text-sm">
                    {newKey}
                  </code>
                  <button
                    type="button"
                    onClick={() => copy(newKey, "Key")}
                    className="rounded-lg bg-green-600 px-4 text-sm font-semibold text-white hover:bg-green-700"
                  >
                    Copy
                  </button>
                </div>
              </div>
            )}
          </Card>

          <Card className="overflow-hidden">
            <h2 className="border-b border-gray-100 px-6 py-4 text-lg font-bold">
              Your keys{" "}
              {keys && (
                <span className="font-normal text-gray-400">
                  ({keys.length}/10)
                </span>
              )}
            </h2>
            {keys?.length === 0 && (
              <p className="px-6 py-8 text-center text-gray-500">
                No API keys yet.
              </p>
            )}
            <ul className="divide-y divide-gray-100">
              {keys?.map((key) => (
                <li key={key.id} className="flex items-center gap-4 px-6 py-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-lg">
                    🔑
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{key.label}</div>
                    <div className="text-xs text-gray-500">
                      Created {formatRelative(key.createdAt)} ·{" "}
                      {key.lastUsedAt
                        ? `last used ${formatRelative(key.lastUsedAt)}`
                        : "never used"}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRevoke(key)}
                    className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-semibold text-red-500 hover:bg-red-50"
                  >
                    Revoke
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </div>

        <Card className="flex flex-col self-start p-6">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div>
              <h2 className="text-lg font-bold">
                Instructions for your AI assistant
              </h2>
              <p className="text-sm text-gray-500">
                Paste this into the chat together with what quiz you want.
              </p>
            </div>
            <button
              type="button"
              onClick={() => copy(instructions, "Instructions")}
              className="shrink-0 rounded-lg bg-blue-50 px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-100"
            >
              Copy
            </button>
          </div>
          <pre className="max-h-[32rem] overflow-auto rounded-xl bg-gray-900 p-4 text-xs leading-relaxed whitespace-pre-wrap text-gray-100">
            {instructions}
          </pre>
        </Card>
      </div>
    </div>
  )
}

export default ApiKeys
