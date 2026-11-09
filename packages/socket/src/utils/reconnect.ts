import { Socket } from "@rahoot/common/types/game/socket"
import { STATUS } from "@rahoot/common/types/game/status"
import type Game from "@rahoot/socket/services/game"
import Registry from "@rahoot/socket/services/registry"

const WAITING_STATUS = {
  name: STATUS.WAIT,
  data: { text: "Waiting for players" },
}

export const reconnectManager = (game: Game, socket: Socket) => {
  if (game.manager.connected) {
    socket.emit("game:reset", "Manager already connected")

    return
  }

  socket.join(game.gameId)
  game.manager.id = socket.id
  game.manager.connected = true

  const status = game.managerStatus ||
    game.lastBroadcastStatus || WAITING_STATUS

  socket.emit("manager:successReconnect", {
    gameId: game.gameId,
    currentQuestion: game.questionProgress,
    status,
    players: game.players,
  })
  socket.emit("game:totalPlayers", game.players.length)
  socket.emit("game:paused", game.paused)

  Registry.getInstance().reactivateGame(game.gameId)
  console.log(`Manager reconnected to game ${game.inviteCode}`)
}

export const reconnectPlayer = (game: Game, socket: Socket) => {
  const { clientId } = socket.handshake.auth
  const player = game.players.find((p) => p.clientId === clientId)

  if (!player) {
    return
  }

  if (player.connected) {
    socket.emit("game:reset", "Player already connected")

    return
  }

  socket.join(game.gameId)

  const oldSocketId = player.id
  player.id = socket.id
  player.connected = true

  for (const answer of game.round.playersAnswers) {
    if (answer.playerId === oldSocketId) {
      answer.playerId = socket.id
    }
  }

  const status = game.playerStatus.get(oldSocketId) ||
    game.lastBroadcastStatus || WAITING_STATUS

  if (game.playerStatus.has(oldSocketId)) {
    const oldStatus = game.playerStatus.get(oldSocketId)!
    game.playerStatus.delete(oldSocketId)
    game.playerStatus.set(socket.id, oldStatus)
  }

  socket.emit("player:successReconnect", {
    gameId: game.gameId,
    currentQuestion: game.questionProgress,
    status,
    player: {
      username: player.username,
      points: player.points,
    },
  })
  socket.emit("game:totalPlayers", game.players.length)
  socket.emit("game:paused", game.paused)
  console.log(
    `Player ${player.username} reconnected to game ${game.inviteCode}`,
  )
}
