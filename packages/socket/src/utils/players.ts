import { Socket } from "@rahoot/common/types/game/socket"
import { botDifficultyValidator } from "@rahoot/common/validators/quizz"
import type Game from "@rahoot/socket/services/game"
import { createBot, MAX_BOTS } from "@rahoot/socket/utils/bots"

export const kickPlayer = (game: Game, socket: Socket, playerId: string) => {
  const player = game.players.find((p) => p.id === playerId)

  if (!game.isManager(socket) || !player) {
    return
  }

  game.players = game.players.filter((p) => p.id !== playerId)
  game.playerStatus.delete(playerId)

  game.io.in(playerId).socketsLeave(game.gameId)
  game.io.to(player.id).emit("game:reset", "You have been kicked by the manager")
  game.io.to(game.manager.id).emit("manager:playerKicked", player.id)
  game.io.to(game.gameId).emit("game:totalPlayers", game.players.length)
}

export const addBot = (game: Game, socket: Socket, difficulty: unknown) => {
  const parsed = botDifficultyValidator.safeParse(difficulty)

  if (!game.isManager(socket) || game.started || !parsed.success) {
    return
  }

  if (game.players.filter((p) => p.bot).length >= MAX_BOTS) {
    socket.emit("manager:errorMessage", `Maximum ${MAX_BOTS} bots per game`)

    return
  }

  const bot = createBot(game.players, parsed.data)

  game.players.push(bot)
  game.io.to(game.manager.id).emit("manager:newPlayer", bot)
  game.io.to(game.gameId).emit("game:totalPlayers", game.players.length)
}
