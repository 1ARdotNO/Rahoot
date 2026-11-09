import { ApiKeyInfo } from "@rahoot/common/types/game"
import { getPath } from "@rahoot/socket/services/config"
import { createHash, randomBytes, randomUUID } from "crypto"
import fs from "fs"

export const API_KEY_PREFIX = "rahoot_"
export const MAX_KEYS_PER_OWNER = 10

type StoredKey = ApiKeyInfo & {
  owner: string
  ownerName: string
  // Only the SHA-256 of the key is stored; the key itself is shown once.
  hash: string
}

const FILE = "api-keys.json"

const hashKey = (key: string) => createHash("sha256").update(key).digest("hex")

const load = (): StoredKey[] => {
  try {
    return JSON.parse(fs.readFileSync(getPath(FILE), "utf-8"))
  } catch {
    return []
  }
}

const store = (keys: StoredKey[]) => {
  // Write-then-rename so a crash mid-write can't wipe every key.
  const tmp = getPath(`${FILE}.tmp`)
  fs.writeFileSync(tmp, JSON.stringify(keys, null, 2), { mode: 0o600 })
  fs.renameSync(tmp, getPath(FILE))
}

const toInfo = ({ id, label, createdAt, lastUsedAt }: StoredKey): ApiKeyInfo => ({
  id,
  label,
  createdAt,
  lastUsedAt,
})

const ApiKeys = {
  list(owner: string): ApiKeyInfo[] {
    return load()
      .filter((k) => k.owner === owner)
      .map(toInfo)
  },

  create(owner: string, ownerName: string, label: string) {
    const keys = load()

    if (keys.filter((k) => k.owner === owner).length >= MAX_KEYS_PER_OWNER) {
      throw new Error(`You can have at most ${MAX_KEYS_PER_OWNER} API keys`)
    }

    const key = `${API_KEY_PREFIX}${randomBytes(32).toString("base64url")}`
    const entry: StoredKey = {
      id: randomUUID(),
      label: label.trim().slice(0, 60) || "API key",
      createdAt: new Date().toISOString(),
      lastUsedAt: null,
      owner,
      ownerName,
      hash: hashKey(key),
    }

    store([...keys, entry])

    return { key, info: toInfo(entry) }
  },

  revoke(owner: string, id: unknown): boolean {
    const keys = load()
    const remaining = keys.filter((k) => !(k.owner === owner && k.id === id))

    if (remaining.length === keys.length) {
      return false
    }

    store(remaining)

    return true
  },

  // Returns the owning user for a valid key and records its use.
  verify(key: string) {
    const hash = hashKey(key)
    const keys = load()
    const match = keys.find((k) => k.hash === hash)

    if (!match) {
      return null
    }

    match.lastUsedAt = new Date().toISOString()
    store(keys)

    return { owner: match.owner, name: `${match.ownerName} (${match.label})` }
  },
}

export default ApiKeys
