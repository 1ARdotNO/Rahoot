import env from "@rahoot/socket/env"
import { createHash, randomBytes, timingSafeEqual } from "crypto"
import * as oidc from "openid-client"

export type ManagerIdentity = {
  // Null is the shared password login, which owns the top-level quiz folder.
  owner: string | null
  name: string
}

type Pending = { verifier: string; nonce: string; expires: number }
type Session = ManagerIdentity & { expires: number }

const LOGIN_TTL_MS = 10 * 60 * 1000
const HANDOFF_TTL_MS = 60 * 1000
const SESSION_TTL_MS = 12 * 60 * 60 * 1000
const SAFE_OWNER = /^[A-Za-z0-9_-]{1,128}$/u

const passwordEnabled = env.MANAGER_AUTH !== "oidc"
const oidcEnabled = env.MANAGER_AUTH !== "password"
const redirectUri =
  env.OIDC_REDIRECT_URI ?? `${env.SOCKET_URL.replace(/\/$/u, "")}/auth/callback`
const allowedGroups = (env.OIDC_ALLOWED_GROUPS ?? "")
  .split(",")
  .map((g) => g.trim())
  .filter(Boolean)
const scopes =
  allowedGroups.length > 0 && !env.OIDC_SCOPES.split(" ").includes("groups")
    ? `${env.OIDC_SCOPES} groups`
    : env.OIDC_SCOPES

const pendingLogins = new Map<string, Pending>()
const handoffCodes = new Map<string, Session>()
const sessions = new Map<string, Session>()

let configPromise: Promise<oidc.Configuration> | null = null

const getConfig = () => {
  if (!configPromise) {
    const issuer = new URL(env.OIDC_ISSUER!)

    configPromise = oidc
      .discovery(
        issuer,
        env.OIDC_CLIENT_ID!,
        undefined,
        env.OIDC_CLIENT_SECRET
          ? oidc.ClientSecretPost(env.OIDC_CLIENT_SECRET)
          : oidc.None(),
        issuer.protocol === "http:"
          ? { execute: [oidc.allowInsecureRequests] }
          : undefined,
      )
      .catch((error) => {
        // Let the next login retry discovery instead of caching the failure.
        configPromise = null
        throw error
      })
  }

  return configPromise
}

const sweep = (map: Map<string, { expires: number }>) => {
  const now = Date.now()

  for (const [key, value] of map) {
    if (value.expires < now) {
      map.delete(key)
    }
  }
}

setInterval(() => {
  sweep(pendingLogins)
  sweep(handoffCodes)
  sweep(sessions)
}, 60 * 1000).unref()

const take = <T extends { expires: number }>(
  map: Map<string, T>,
  key: unknown,
): T | null => {
  if (typeof key !== "string") {
    return null
  }

  const value = map.get(key)
  map.delete(key)

  return value && value.expires >= Date.now() ? value : null
}

// Folder-safe, stable id per OIDC subject; unusual subjects are hashed.
export const ownerFromSubject = (sub: string) =>
  SAFE_OWNER.test(sub) ? sub : createHash("sha256").update(sub).digest("hex")

export const authMethods = () => ({
  password: passwordEnabled,
  oidc: oidcEnabled ? { name: env.OIDC_PROVIDER_NAME } : null,
})

export const checkPassword = (input: unknown, expected: unknown) => {
  if (!passwordEnabled || typeof input !== "string" || typeof expected !== "string") {
    return false
  }

  const a = createHash("sha256").update(input).digest()
  const b = createHash("sha256").update(expected).digest()

  return timingSafeEqual(a, b)
}

export const startLogin = async (): Promise<URL> => {
  const config = await getConfig()
  const verifier = oidc.randomPKCECodeVerifier()
  const state = oidc.randomState()
  const nonce = oidc.randomNonce()

  pendingLogins.set(state, { verifier, nonce, expires: Date.now() + LOGIN_TTL_MS })

  /* eslint-disable camelcase -- OAuth parameter names are fixed by the spec */
  return oidc.buildAuthorizationUrl(config, {
    redirect_uri: redirectUri,
    scope: scopes,
    state,
    nonce,
    code_challenge: await oidc.calculatePKCECodeChallenge(verifier),
    code_challenge_method: "S256",
  })
  /* eslint-enable camelcase */
}

// Returns a one-time hand-off code the web page swaps for a session over the socket.
export const finishLogin = async (search: string): Promise<string> => {
  const params = new URLSearchParams(search)
  const state = params.get("state")
  const pending = take(pendingLogins, state)

  if (params.get("error")) {
    throw new Error(params.get("error_description") ?? params.get("error")!)
  }

  if (!pending) {
    throw new Error("Login expired, please try again")
  }

  const config = await getConfig()
  // Built from the configured redirect URI so proxies rewriting Host don't break validation.
  const currentUrl = new URL(redirectUri)
  currentUrl.search = search

  const tokens = await oidc.authorizationCodeGrant(config, currentUrl, {
    pkceCodeVerifier: pending.verifier,
    expectedState: state!,
    expectedNonce: pending.nonce,
  })
  const claims = tokens.claims()

  if (!claims?.sub) {
    throw new Error("Identity provider returned no subject")
  }

  if (allowedGroups.length > 0) {
    const groups = Array.isArray(claims.groups) ? claims.groups : []

    if (!groups.some((g) => allowedGroups.includes(String(g)))) {
      throw new Error("Your account is not allowed to manage quizzes")
    }
  }

  const name = [claims.name, claims.preferred_username, claims.email].find(
    (v): v is string => typeof v === "string" && v.length > 0,
  )
  const code = randomBytes(32).toString("base64url")

  handoffCodes.set(code, {
    owner: ownerFromSubject(claims.sub),
    name: name ?? claims.sub,
    expires: Date.now() + HANDOFF_TTL_MS,
  })

  return code
}

export const createSession = (identity: ManagerIdentity) => {
  const token = randomBytes(32).toString("base64url")
  sessions.set(token, { ...identity, expires: Date.now() + SESSION_TTL_MS })

  return token
}

export const redeemHandoff = (code: unknown) => {
  const session = take(handoffCodes, code)

  if (!session) {
    return null
  }

  const identity = { owner: session.owner, name: session.name }

  return { token: createSession(identity), identity }
}

export const resumeSession = (token: unknown): ManagerIdentity | null => {
  if (typeof token !== "string") {
    return null
  }

  const session = sessions.get(token)

  if (!session || session.expires < Date.now()) {
    sessions.delete(token)

    return null
  }

  return { owner: session.owner, name: session.name }
}

export const endSession = (token: unknown) => {
  if (typeof token === "string") {
    sessions.delete(token)
  }
}

export const webManagerUrl = (hash: Record<string, string>) =>
  `${env.WEB_ORIGIN.replace(/\/$/u, "")}/manager#${new URLSearchParams(hash)}`
