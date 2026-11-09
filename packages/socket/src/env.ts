import { createEnv } from "@t3-oss/env-core"
import { z } from "zod/v4"

const env = createEnv({
  server: {
    WEB_ORIGIN: z.string().optional().default("http://localhost:3000"),
    SOCKER_PORT: z.string().optional().default("3001"),
    SOCKET_URL: z.string().optional().default("http://localhost:3001"),

    MANAGER_AUTH: z.enum(["password", "oidc", "both"]).default("password"),
    OIDC_ISSUER: z.url().optional(),
    OIDC_CLIENT_ID: z.string().min(1).optional(),
    OIDC_CLIENT_SECRET: z.string().min(1).optional(),
    OIDC_REDIRECT_URI: z.url().optional(),
    OIDC_SCOPES: z.string().default("openid profile email"),
    OIDC_ALLOWED_GROUPS: z.string().optional(),
    OIDC_PROVIDER_NAME: z.string().default("Pocket ID"),
  },

  runtimeEnv: {
    WEB_ORIGIN: process.env.WEB_ORIGIN,
    SOCKER_PORT: process.env.SOCKER_PORT,
    SOCKET_URL: process.env.SOCKET_URL,

    MANAGER_AUTH: process.env.MANAGER_AUTH,
    OIDC_ISSUER: process.env.OIDC_ISSUER,
    OIDC_CLIENT_ID: process.env.OIDC_CLIENT_ID,
    OIDC_CLIENT_SECRET: process.env.OIDC_CLIENT_SECRET,
    OIDC_REDIRECT_URI: process.env.OIDC_REDIRECT_URI,
    OIDC_SCOPES: process.env.OIDC_SCOPES,
    OIDC_ALLOWED_GROUPS: process.env.OIDC_ALLOWED_GROUPS,
    OIDC_PROVIDER_NAME: process.env.OIDC_PROVIDER_NAME,
  },

  // Empty strings from compose files (`OIDC_CLIENT_SECRET=`) mean "unset".
  emptyStringAsUndefined: true,
})

if (env.MANAGER_AUTH !== "password" && (!env.OIDC_ISSUER || !env.OIDC_CLIENT_ID)) {
  throw new Error(
    `MANAGER_AUTH=${env.MANAGER_AUTH} requires OIDC_ISSUER and OIDC_CLIENT_ID`,
  )
}

if (env.MANAGER_AUTH !== "password" && env.WEB_ORIGIN === "*") {
  throw new Error("OIDC login needs WEB_ORIGIN set to the real web URL, not '*'")
}

export default env
