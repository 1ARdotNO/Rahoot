import { Server } from "@rahoot/common/types/game/socket"
import { inviteCodeValidator } from "@rahoot/common/validators/auth"
import {
  gameOptionsValidator,
  quizzIdValidator,
  quizzValidator,
} from "@rahoot/common/validators/quizz"
import env from "@rahoot/socket/env"
import Config, { MAX_IMAGE_BYTES } from "@rahoot/socket/services/config"
import Game from "@rahoot/socket/services/game"
import Registry from "@rahoot/socket/services/registry"
import { withGame } from "@rahoot/socket/utils/game"
import { createServer } from "http"
import { Server as ServerIO } from "socket.io"
import fs from "fs"
import path from "path"

Config.init()

const registry = Registry.getInstance()
const port = 3001

// Socket ids that passed manager:auth; quiz management and game creation require it.
const authenticatedManagers = new Set<string>()

const MIME_TYPES: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".gif": "image/gif",
  ".webp": "image/webp",
}

const httpServer = createServer((req, res) => {
  if (req.method === "GET" && req.url?.startsWith("/images/")) {
    const filename = path.basename(req.url)
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

    return
  }

  res.writeHead(404)
  res.end()
})

const io: Server = new ServerIO(httpServer, {
  // Base64 inflates uploads by ~4/3; leave headroom for several images per save.
  maxHttpBufferSize: MAX_IMAGE_BYTES * 4,
  cors: {
    origin: [env.WEB_ORIGIN],
  },
})

console.log(`Socket server running on port ${port}`)
httpServer.listen(port)

io.on("connection", (socket) => {
  console.log(
    `A user connected: socketId: ${socket.id}, clientId: ${socket.handshake.auth.clientId}`,
  )

  socket.on("player:reconnect", ({ gameId }) => {
    const game = registry.getPlayerGame(gameId, socket.handshake.auth.clientId)

    if (game) {
      game.reconnect(socket)

      return
    }

    socket.emit("game:reset", "Game not found")
  })

  socket.on("manager:reconnect", ({ gameId }) => {
    const game = registry.getManagerGame(gameId, socket.handshake.auth.clientId)

    if (game) {
      game.reconnect(socket)

      return
    }

    socket.emit("game:reset", "Game expired")
  })

  socket.on("manager:auth", (password) => {
    try {
      const config = Config.game()

      if (password !== config.managerPassword) {
        socket.emit("manager:errorMessage", "Invalid password")

        return
      }

      authenticatedManagers.add(socket.id)
      socket.emit("manager:quizzList", Config.quizzList())
    } catch (error) {
      console.error("Failed to read game config:", error)
      socket.emit("manager:errorMessage", "Failed to read game config")
    }
  })

  const requireManager = (callback: () => void) => {
    if (!authenticatedManagers.has(socket.id)) {
      socket.emit("manager:errorMessage", "Unauthorized")

      return
    }

    callback()
  }

  const loadQuizz = (quizzId: string) => {
    const raw = Config.getQuizz(quizzId)

    if (!raw) {
      return { ok: false, error: "Quizz not found" } as const
    }

    const parsed = quizzValidator.safeParse(raw)

    if (!parsed.success) {
      const [issue] = parsed.error.issues

      return {
        ok: false,
        error: `Quizz file is invalid at ${issue.path.join(".")}: ${issue.message}`,
      } as const
    }

    return { ok: true, quizz: { ...parsed.data, id: raw.id } } as const
  }

  socket.on("manager:getQuizz", (quizzId) =>
    requireManager(() => {
      const result = loadQuizz(quizzId)

      if (!result.ok) {
        socket.emit("manager:errorMessage", result.error)

        return
      }

      socket.emit("manager:quizzData", result.quizz)
    }),
  )

  socket.on("manager:saveQuizz", (payload) =>
    requireManager(() => {
      const parsed = quizzValidator.safeParse(payload?.quizz)

      if (!parsed.success) {
        socket.emit(
          "manager:errorMessage",
          `Invalid quizz at ${parsed.error.issues[0].path.join(".")}: ${parsed.error.issues[0].message}`,
        )

        return
      }

      if (payload.id !== undefined && !quizzIdValidator.safeParse(payload.id).success) {
        socket.emit("manager:errorMessage", "Invalid quizz id")

        return
      }

      const quizz = parsed.data
      const images = Array.isArray(payload.images) ? payload.images : []

      try {
        for (const img of images) {
          const question = quizz.questions[img.questionIndex]

          if (!question || typeof img.data !== "string") {
            throw new Error("Invalid image reference")
          }

          question.image = `${env.SOCKET_URL}/images/${Config.saveImage(img.data)}`
        }

        const saved = Config.saveQuizz(payload.id, quizz)
        socket.emit("manager:quizzSaved", saved)
        socket.emit("manager:quizzList", Config.quizzList())
      } catch (error) {
        console.error("Failed to save quizz:", error)
        socket.emit(
          "manager:errorMessage",
          error instanceof Error ? error.message : "Failed to save quizz",
        )
      }
    }),
  )

  socket.on("manager:deleteQuizz", (quizzId) =>
    requireManager(() => {
      if (!Config.deleteQuizz(quizzId)) {
        socket.emit("manager:errorMessage", "Quizz not found")

        return
      }

      socket.emit("manager:quizzDeleted", quizzId)
      socket.emit("manager:quizzList", Config.quizzList())
    }),
  )

  socket.on("game:create", (payload) =>
    requireManager(() => {
      const options = gameOptionsValidator.safeParse(payload?.options ?? {})
      const result = loadQuizz(payload?.quizzId)

      if (!result.ok) {
        socket.emit("game:errorMessage", result.error)

        return
      }

      if (!options.success) {
        socket.emit("game:errorMessage", "Invalid game options")

        return
      }

      const game = new Game(io, socket, result.quizz, options.data)
      registry.addGame(game)
    }),
  )

  socket.on("player:join", (inviteCode) => {
    const result = inviteCodeValidator.safeParse(inviteCode)

    if (result.error) {
      socket.emit("game:errorMessage", result.error.issues[0].message)

      return
    }

    const game = registry.getGameByInviteCode(inviteCode)

    if (!game) {
      socket.emit("game:errorMessage", "Game not found")

      return
    }

    socket.emit("game:successRoom", game.gameId)
  })

  socket.on("player:login", ({ gameId, data }) =>
    withGame(gameId, socket, (game) => game.join(socket, data.username)),
  )

  socket.on("manager:kickPlayer", ({ gameId, playerId }) =>
    withGame(gameId, socket, (game) => game.kickPlayer(socket, playerId)),
  )

  socket.on("manager:startGame", ({ gameId }) =>
    withGame(gameId, socket, (game) => game.start(socket)),
  )

  socket.on("player:selectedAnswer", ({ gameId, data }) =>
    withGame(gameId, socket, (game) =>
      game.selectAnswer(socket, data?.answer),
    ),
  )

  socket.on("manager:abortQuiz", ({ gameId }) =>
    withGame(gameId, socket, (game) => game.abortRound(socket)),
  )

  socket.on("manager:nextQuestion", ({ gameId }) =>
    withGame(gameId, socket, (game) => game.nextRound(socket)),
  )

  socket.on("manager:showLeaderboard", ({ gameId }) =>
    withGame(gameId, socket, (game) => game.showLeaderboard(socket)),
  )

  socket.on("manager:togglePause", ({ gameId }) =>
    withGame(gameId, socket, (game) => game.togglePause(socket)),
  )

  socket.on("manager:skipQuestion", ({ gameId }) =>
    withGame(gameId, socket, (game) => game.skipQuestion(socket)),
  )

  socket.on("disconnect", () => {
    console.log(`A user disconnected : ${socket.id}`)
    authenticatedManagers.delete(socket.id)

    const managerGame = registry.getGameByManagerSocketId(socket.id)

    if (managerGame) {
      managerGame.manager.connected = false
      registry.markGameAsEmpty(managerGame)

      if (!managerGame.started) {
        console.log("Reset game (manager disconnected)")
        managerGame.abortCooldown()
        io.to(managerGame.gameId).emit("game:reset", "Manager disconnected")
        registry.removeGame(managerGame.gameId)

        return
      }
    }

    const game = registry.getGameByPlayerSocketId(socket.id)

    if (!game) {
      return
    }

    const player = game.players.find((p) => p.id === socket.id)

    if (!player) {
      return
    }

    if (!game.started) {
      game.players = game.players.filter((p) => p.id !== socket.id)

      io.to(game.manager.id).emit("manager:removePlayer", player.id)
      io.to(game.gameId).emit("game:totalPlayers", game.players.length)

      console.log(`Removed player ${player.username} from game ${game.gameId}`)

      return
    }

    player.connected = false
    io.to(game.gameId).emit("game:totalPlayers", game.players.length)
  })
})

process.on("SIGINT", () => {
  Registry.getInstance().cleanup()
  process.exit(0)
})

process.on("SIGTERM", () => {
  Registry.getInstance().cleanup()
  process.exit(0)
})
