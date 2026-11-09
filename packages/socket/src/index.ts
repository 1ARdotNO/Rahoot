import { ActionResult } from "@rahoot/common/types/game"
import { Server } from "@rahoot/common/types/game/socket"
import { inviteCodeValidator } from "@rahoot/common/validators/auth"
import {
  gameOptionsValidator,
  quizzIdValidator,
  quizzValidator,
} from "@rahoot/common/validators/quizz"
import env from "@rahoot/socket/env"
import ApiKeys, { API_KEY_PREFIX } from "@rahoot/socket/services/apiKeys"
import Config, { MAX_IMAGE_BYTES } from "@rahoot/socket/services/config"
import Game from "@rahoot/socket/services/game"
import Registry from "@rahoot/socket/services/registry"
import Results from "@rahoot/socket/services/results"
import { withGame } from "@rahoot/socket/utils/game"
import { addBot, kickPlayer } from "@rahoot/socket/utils/players"
import { handleHttp } from "@rahoot/socket/http"
import {
  authMethods,
  checkPassword,
  createSession,
  endSession,
  ManagerIdentity,
  redeemHandoff,
  resumeSession,
} from "@rahoot/socket/services/auth"
import { createServer } from "http"
import { Server as ServerIO } from "socket.io"

Config.init()

const registry = Registry.getInstance()

type HostActionEvent =
  | "manager:startGame"
  | "manager:abortQuiz"
  | "manager:nextQuestion"
  | "manager:showLeaderboard"
  | "manager:togglePause"
  | "manager:skipQuestion"
const port = 3001

// Logged-in manager sockets; quiz management and game creation require an entry.
const authenticatedManagers = new Map<string, ManagerIdentity>()

const httpServer = createServer((req, res) => {
  handleHttp(req, res)
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

  const signIn = (identity: ManagerIdentity, token?: string) => {
    authenticatedManagers.set(socket.id, identity)
    socket.emit("manager:session", {
      name: identity.name,
      token,
      canManageApiKeys: identity.via === "oidc",
    })
    socket.emit("manager:quizzList", Config.quizzList(identity.owner))
  }

  socket.on("manager:authMethods", () => {
    socket.emit("manager:authMethods", authMethods())
  })

  socket.on("manager:auth", (password) => {
    // API keys work even when MANAGER_AUTH=oidc hides the shared password.
    if (
      authMethods().apiKeys &&
      typeof password === "string" &&
      password.startsWith(API_KEY_PREFIX)
    ) {
      const user = ApiKeys.verify(password)

      if (!user) {
        socket.emit("manager:errorMessage", "Invalid API key")

        return
      }

      const identity: ManagerIdentity = { ...user, via: "apiKey" }
      signIn(identity, createSession(identity))

      return
    }

    try {
      if (!checkPassword(password, Config.game().managerPassword)) {
        socket.emit("manager:errorMessage", "Invalid password")

        return
      }

      const identity: ManagerIdentity = {
        owner: null,
        name: "Manager",
        via: "password",
      }
      signIn(identity, createSession(identity))
    } catch (error) {
      console.error("Failed to read game config:", error)
      socket.emit("manager:errorMessage", "Failed to read game config")
    }
  })

  socket.on("manager:oidcHandoff", (code) => {
    const result = redeemHandoff(code)

    if (!result) {
      socket.emit("manager:sessionExpired")

      return
    }

    signIn(result.identity, result.token)
  })

  socket.on("manager:resume", (token) => {
    const identity = resumeSession(token)

    if (!identity) {
      socket.emit("manager:sessionExpired")

      return
    }

    signIn(identity)
  })

  socket.on("manager:logout", (token) => {
    endSession(token)
    authenticatedManagers.delete(socket.id)
  })

  const requireManager = (callback: (_identity: ManagerIdentity) => void) => {
    const identity = authenticatedManagers.get(socket.id)

    if (!identity) {
      socket.emit("manager:errorMessage", "Unauthorized")

      return
    }

    callback(identity)
  }

  const loadQuizz = (owner: string | null, quizzId: string) => {
    const raw = Config.getQuizz(owner, quizzId)

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

  // Only interactive OIDC logins may manage keys, so a leaked key can't mint more.
  const requireKeyManager = (callback: (_owner: string) => void) =>
    requireManager((identity) => {
      if (identity.via !== "oidc" || identity.owner === null) {
        socket.emit("manager:errorMessage", "API keys need a single sign-on login")

        return
      }

      callback(identity.owner)
    })

  socket.on("manager:listApiKeys", () =>
    requireKeyManager((owner) => {
      socket.emit("manager:apiKeys", ApiKeys.list(owner))
    }),
  )

  socket.on("manager:createApiKey", (label) =>
    requireKeyManager((owner) => {
      try {
        const name = authenticatedManagers.get(socket.id)?.name ?? owner
        const created = ApiKeys.create(owner, name, String(label ?? ""))
        socket.emit("manager:apiKeyCreated", created)
        socket.emit("manager:apiKeys", ApiKeys.list(owner))
      } catch (error) {
        socket.emit(
          "manager:errorMessage",
          error instanceof Error ? error.message : "Failed to create API key",
        )
      }
    }),
  )

  socket.on("manager:revokeApiKey", (id) =>
    requireKeyManager((owner) => {
      if (!ApiKeys.revoke(owner, id)) {
        socket.emit("manager:errorMessage", "API key not found")

        return
      }

      socket.emit("manager:apiKeys", ApiKeys.list(owner))
    }),
  )

  socket.on("manager:getQuizz", (quizzId) =>
    requireManager(({ owner }) => {
      const result = loadQuizz(owner, quizzId)

      if (!result.ok) {
        socket.emit("manager:errorMessage", result.error)

        return
      }

      socket.emit("manager:quizzData", result.quizz)
    }),
  )

  socket.on("manager:saveQuizz", (payload) =>
    requireManager(({ owner }) => {
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

        const saved = Config.saveQuizz(owner, payload.id, quizz)
        socket.emit("manager:quizzSaved", saved)
        socket.emit("manager:quizzList", Config.quizzList(owner))
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
    requireManager(({ owner }) => {
      if (!Config.deleteQuizz(owner, quizzId)) {
        socket.emit("manager:errorMessage", "Quizz not found")

        return
      }

      socket.emit("manager:quizzDeleted", quizzId)
      socket.emit("manager:quizzList", Config.quizzList(owner))
    }),
  )

  socket.on("manager:getResults", () =>
    requireManager(({ owner }) => {
      socket.emit("manager:resultsList", Results.list(owner))
    }),
  )

  socket.on("manager:getResult", (resultId) =>
    requireManager(({ owner }) => {
      const result = Results.get(owner, resultId)

      if (!result) {
        socket.emit("manager:errorMessage", "Result not found")

        return
      }

      socket.emit("manager:resultData", result)
    }),
  )

  socket.on("manager:deleteResult", (resultId) =>
    requireManager(({ owner }) => {
      if (!Results.delete(owner, resultId)) {
        socket.emit("manager:errorMessage", "Result not found")

        return
      }

      socket.emit("manager:resultsList", Results.list(owner))
    }),
  )

  socket.on("game:create", (payload) =>
    requireManager(({ owner }) => {
      const options = gameOptionsValidator.safeParse(payload?.options ?? {})
      const result = loadQuizz(owner, payload?.quizzId)

      if (!result.ok) {
        socket.emit("game:errorMessage", result.error)

        return
      }

      if (!options.success) {
        socket.emit("game:errorMessage", "Invalid game options")

        return
      }

      const game = new Game(io, socket, result.quizz, {
        options: options.data,
        owner,
        quizzId: result.quizz.id,
      })
      registry.addGame(game)
    }),
  )

  // Every host action gets a reply, so the host UI never waits on a click the server ignored.
  const hostAction = (
    event: HostActionEvent,
    run: (_game: Game) => ActionResult,
  ) =>
    socket.on(event, (message, ack) => {
      const reply = typeof ack === "function" ? ack : () => undefined
      const game = message?.gameId
        ? registry.getGameById(message.gameId)
        : undefined

      if (!game) {
        reply({ ok: false, error: "Game not found" })

        return
      }

      if (!game.isManager(socket)) {
        reply({ ok: false, error: "This screen isn't the host of the game" })

        return
      }

      const result: ActionResult =
        typeof message.step === "number" && message.step !== game.step
          ? { ok: false, error: "The screen changed", stale: true }
          : run(game)
      const current = game.managerStatus ?? game.lastBroadcastStatus

      reply(
        !result.ok && result.stale && current
          ? { ...result, current: { ...current, step: game.step } }
          : result,
      )
    })

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
    withGame(gameId, socket, (game) => kickPlayer(game, socket, playerId)),
  )

  socket.on("manager:addBot", ({ gameId, difficulty }) =>
    withGame(gameId, socket, (game) => addBot(game, socket, difficulty)),
  )

  hostAction("manager:startGame", (game) => game.start())

  socket.on("player:selectedAnswer", ({ gameId, data }) =>
    withGame(gameId, socket, (game) =>
      game.submitAnswer(socket.id, data?.answer),
    ),
  )

  hostAction("manager:abortQuiz", (game) => game.abortRound())

  hostAction("manager:nextQuestion", (game) => game.nextRound())

  hostAction("manager:showLeaderboard", (game) => game.showLeaderboard())

  hostAction("manager:togglePause", (game) => game.togglePause())

  hostAction("manager:skipQuestion", (game) => game.skipQuestion())

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
