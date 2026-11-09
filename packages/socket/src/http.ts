import env from "@rahoot/socket/env"
import {
  authMethods,
  finishLogin,
  startLogin,
  webManagerUrl,
} from "@rahoot/socket/services/auth"
import Config from "@rahoot/socket/services/config"
import fs from "fs"
import { IncomingMessage, ServerResponse } from "http"
import path from "path"

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
}

const redirect = (res: ServerResponse, location: string) => {
  res.writeHead(302, { Location: location, "Cache-Control": "no-store" })
  res.end()
}

const authError = (res: ServerResponse, error: unknown) => {
  console.error("OIDC login failed:", error)
  const message = error instanceof Error ? error.message : "Login failed"
  redirect(res, webManagerUrl({ authError: message.slice(0, 200) }))
}

const serveImage = (url: URL, res: ServerResponse) => {
  const filename = path.basename(url.pathname)
  const filePath = path.join(Config.getImagesPath(), filename)
  const contentType = MIME_TYPES[path.extname(filename).toLowerCase()]

  if (!contentType || !fs.existsSync(filePath)) {
    res.writeHead(404)
    res.end("Not found")

    return
  }

  res.writeHead(200, {
    "Content-Type": contentType,
    "X-Content-Type-Options": "nosniff",
    "Access-Control-Allow-Origin": env.WEB_ORIGIN,
    "Cache-Control": "public, max-age=31536000",
  })
  fs.createReadStream(filePath).pipe(res)
}

export const handleHttp = async (req: IncomingMessage, res: ServerResponse) => {
  // Socket.io handles its own path; everything else lands here.
  const url = new URL(req.url ?? "/", "http://localhost")

  if (req.method !== "GET") {
    res.writeHead(404)
    res.end()

    return
  }

  if (url.pathname.startsWith("/images/")) {
    serveImage(url, res)

    return
  }

  const oidcEnabled = authMethods().oidc !== null

  if (oidcEnabled && url.pathname === "/auth/login") {
    try {
      redirect(res, (await startLogin()).href)
    } catch (error) {
      authError(res, error)
    }

    return
  }

  if (oidcEnabled && url.pathname === "/auth/callback") {
    try {
      redirect(res, webManagerUrl({ handoff: await finishLogin(url.search) }))
    } catch (error) {
      authError(res, error)
    }

    return
  }

  res.writeHead(404)
  res.end()
}
