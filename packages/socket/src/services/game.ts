import {
  Answer,
  AnswerValue,
  GameOptions,
  Player,
  Quizz,
  QuizzQuestion,
} from "@rahoot/common/types/game"
import { Server, Socket } from "@rahoot/common/types/game/socket"
import { Status, STATUS, StatusDataMap } from "@rahoot/common/types/game/status"
import { usernameValidator } from "@rahoot/common/validators/auth"
import { getChoices } from "@rahoot/common/validators/quizz"
import Countdown from "@rahoot/socket/utils/countdown"
import { createInviteCode, timeToPoint } from "@rahoot/socket/utils/game"
import {
  describeSolution,
  isQuestion,
  parseAnswer,
  prepareQuizz,
} from "@rahoot/socket/utils/quizz"
import {
  buildResponses,
  scoreRound,
  toPublic,
} from "@rahoot/socket/utils/results"
import { reconnectManager, reconnectPlayer } from "@rahoot/socket/utils/reconnect"
import sleep from "@rahoot/socket/utils/sleep"
import { v4 as uuid } from "uuid"

class Game {
  io: Server

  gameId: string
  manager: {
    id: string
    clientId: string
    connected: boolean
  }
  inviteCode: string
  started: boolean
  paused = false

  lastBroadcastStatus: { name: Status; data: StatusDataMap[Status] } | null =
    null
  managerStatus: { name: Status; data: StatusDataMap[Status] } | null = null
  playerStatus: Map<string, { name: Status; data: StatusDataMap[Status] }> =
    new Map()

  leaderboard: Player[] = []
  tempOldLeaderboard: Player[] | null = null

  quizz: Quizz
  options: GameOptions
  players: Player[] = []

  round: {
    index: number
    // Bumped on every round change; awaits in an older round see the mismatch and stop.
    token: number
    accepting: boolean
    playersAnswers: Answer[]
    startTime: number
    pausedAt: number
  } = {
    index: 0,
    token: 0,
    accepting: false,
    playersAnswers: [],
    startTime: 0,
    pausedAt: 0,
  }

  countdown = new Countdown({
    onTick: (remaining) => this.io.to(this.gameId).emit("game:cooldown", remaining),
    isPaused: () => this.paused,
  })

  constructor(io: Server, socket: Socket, quizz: Quizz, options: GameOptions) {
    if (!io) {
      throw new Error("Socket server not initialized")
    }

    this.io = io
    this.gameId = uuid()
    this.started = false
    this.quizz = prepareQuizz(quizz, options)
    this.options = options

    this.inviteCode = createInviteCode()
    this.manager = {
      id: socket.id,
      clientId: socket.handshake.auth.clientId,
      connected: true,
    }

    socket.join(this.gameId)
    socket.emit("manager:gameCreated", {
      gameId: this.gameId,
      inviteCode: this.inviteCode,
    })

    console.log(
      `New game created: ${this.inviteCode} subject: ${this.quizz.subject}`,
    )
  }

  get currentItem() {
    return this.quizz.questions[this.round.index]
  }

  get totalQuestions() {
    return this.quizz.questions.filter(isQuestion).length
  }

  get questionProgress() {
    const current = this.quizz.questions
      .slice(0, this.round.index + 1)
      .filter(isQuestion).length

    return { current: Math.max(current, 1), total: this.totalQuestions }
  }

  get hasNextItem() {
    return this.round.index + 1 < this.quizz.questions.length
  }

  get managerPhase(): Status | undefined {
    return (this.managerStatus ?? this.lastBroadcastStatus)?.name
  }

  isManager(socket: Socket) {
    return this.manager.id === socket.id
  }

  broadcastStatus<T extends Status>(status: T, data: StatusDataMap[T]) {
    const statusData = { name: status, data }
    this.lastBroadcastStatus = statusData
    this.io.to(this.gameId).emit("game:status", statusData)
  }

  sendStatus<T extends Status>(
    target: string,
    status: T,
    data: StatusDataMap[T],
  ) {
    const statusData = { name: status, data }

    if (this.manager.id === target) {
      this.managerStatus = statusData
    } else {
      this.playerStatus.set(target, statusData)
    }

    this.io.to(target).emit("game:status", statusData)
  }

  join(socket: Socket, username: string) {
    const isAlreadyConnected = this.players.find(
      (p) => p.clientId === socket.handshake.auth.clientId,
    )

    if (isAlreadyConnected) {
      socket.emit("game:errorMessage", "Player already connected")

      return
    }

    const result = usernameValidator.safeParse(username)

    if (result.error) {
      socket.emit("game:errorMessage", result.error.issues[0].message)

      return
    }

    socket.join(this.gameId)

    const playerData: Player = {
      id: socket.id,
      clientId: socket.handshake.auth.clientId,
      connected: true,
      username,
      points: 0,
      streak: 0,
    }

    this.players.push(playerData)

    this.io.to(this.manager.id).emit("manager:newPlayer", playerData)
    this.io.to(this.gameId).emit("game:totalPlayers", this.players.length)

    socket.emit("game:successJoin", this.gameId)
  }

  kickPlayer(socket: Socket, playerId: string) {
    if (!this.isManager(socket)) {
      return
    }

    const player = this.players.find((p) => p.id === playerId)

    if (!player) {
      return
    }

    this.players = this.players.filter((p) => p.id !== playerId)
    this.playerStatus.delete(playerId)

    this.io.in(playerId).socketsLeave(this.gameId)
    this.io
      .to(player.id)
      .emit("game:reset", "You have been kicked by the manager")
    this.io.to(this.manager.id).emit("manager:playerKicked", player.id)

    this.io.to(this.gameId).emit("game:totalPlayers", this.players.length)
  }

  reconnect(socket: Socket) {
    const { clientId } = socket.handshake.auth

    if (this.manager.clientId === clientId) {
      reconnectManager(this, socket)
    } else {
      reconnectPlayer(this, socket)
    }
  }

  startCooldown(seconds: number) {
    return this.countdown.start(seconds)
  }

  abortCooldown() {
    this.countdown.abort()
  }

  private setPaused(paused: boolean) {
    if (this.paused === paused) {
      return
    }

    if (paused) {
      this.round.pausedAt = Date.now()
    } else {
      // Shift the start so time spent paused doesn't cost players points.
      this.round.startTime += Date.now() - this.round.pausedAt
    }

    this.paused = paused
    this.io.to(this.gameId).emit("game:paused", paused)
  }

  async start(socket: Socket) {
    if (!this.isManager(socket) || this.started) {
      return
    }

    this.started = true
    const {token} = this.round

    this.broadcastStatus(STATUS.SHOW_START, {
      time: 3,
      subject: this.quizz.subject,
    })

    await sleep(3)

    if (!this.started || token !== this.round.token) {
      return
    }

    this.io.to(this.gameId).emit("game:startCooldown")
    await this.startCooldown(3)

    if (!this.started || token !== this.round.token) {
      return
    }

    this.newRound()
  }

  async newRound() {
    if (!this.started) {
      return
    }

    this.round.token += 1
    const { token } = this.round
    const isCurrent = () => this.started && token === this.round.token

    this.setPaused(false)
    this.round.accepting = false
    this.round.playersAnswers = []
    this.playerStatus.clear()
    this.managerStatus = null

    const item = this.currentItem

    if (!isQuestion(item)) {
      this.broadcastStatus(STATUS.SHOW_SLIDE, {
        title: item.title,
        content: item.content,
        image: item.image,
      })

      return
    }

    const { current, total } = this.questionProgress
    const choices = getChoices(item)

    this.io.to(this.gameId).emit("game:updateQuestion", { current, total })

    this.broadcastStatus(STATUS.SHOW_PREPARED, {
      type: item.type,
      totalAnswers: choices.length,
      questionNumber: current,
    })

    await sleep(2)

    if (!isCurrent()) {
      return
    }

    this.broadcastStatus(STATUS.SHOW_QUESTION, {
      question: item.question,
      image: item.image,
      cooldown: item.cooldown,
    })

    await sleep(item.cooldown)

    if (!isCurrent()) {
      return
    }

    this.round.startTime = Date.now()
    this.round.accepting = true

    this.broadcastStatus(STATUS.SELECT_ANSWER, {
      type: item.type,
      question: item.question,
      answers: choices,
      slider:
        item.type === "slider"
          ? { min: item.min, max: item.max, step: item.step }
          : undefined,
      image: item.image,
      video: item.video,
      audio: item.audio,
      time: item.time,
      totalPlayer: this.players.length,
    })

    await this.startCooldown(item.time)

    if (!isCurrent()) {
      return
    }

    this.round.accepting = false
    this.setPaused(false)
    this.showResults(item)
  }

  showResults(item: QuizzQuestion) {
    const oldLeaderboard =
      this.leaderboard.length === 0
        ? this.players.map((p) => ({ ...p }))
        : this.leaderboard.map((p) => ({ ...p }))

    const outcomes = scoreRound(
      item,
      this.players,
      this.round.playersAnswers,
      this.options.streakBonus,
    )

    this.players.sort((a, b) => b.points - a.points)

    const correctAnswer = describeSolution(item)

    this.players.forEach((player, index) => {
      const outcome = outcomes.get(player.id)!
      const aheadPlayer = this.players[index - 1]

      this.sendStatus(player.id, STATUS.SHOW_RESULT, {
        correct: outcome.correct,
        message: outcome.message,
        points: outcome.points,
        myPoints: player.points,
        rank: index + 1,
        aheadOfMe: aheadPlayer ? aheadPlayer.username : null,
        correctAnswer,
        streak: this.options.streakBonus ? player.streak : 0,
        streakBonus: outcome.bonus,
      })
    })

    this.sendStatus(
      this.manager.id,
      STATUS.SHOW_RESPONSES,
      buildResponses(item, this.round.playersAnswers),
    )

    this.leaderboard = this.players.map((p) => ({ ...p }))
    this.tempOldLeaderboard = oldLeaderboard

    this.round.playersAnswers = []
  }

  selectAnswer(socket: Socket, value: unknown) {
    const item = this.currentItem

    if (!this.round.accepting || this.paused || !isQuestion(item)) {
      return
    }

    const player = this.players.find((p) => p.id === socket.id)

    if (!player) {
      return
    }

    if (this.round.playersAnswers.find((p) => p.playerId === socket.id)) {
      return
    }

    const answer: AnswerValue | null = parseAnswer(item, value)

    if (answer === null) {
      return
    }

    this.round.playersAnswers.push({
      playerId: player.id,
      value: answer,
      timePoints: timeToPoint(this.round.startTime, item.time),
    })

    this.sendStatus(socket.id, STATUS.WAIT, {
      text: "Waiting for the players to answer",
    })

    socket
      .to(this.gameId)
      .emit("game:playerAnswer", this.round.playersAnswers.length)

    this.io.to(this.gameId).emit("game:totalPlayers", this.players.length)

    if (this.round.playersAnswers.length === this.players.length) {
      this.abortCooldown()
    }
  }

  nextRound(socket: Socket) {
    if (!this.started || !this.isManager(socket)) {
      return
    }

    const phase = this.managerPhase

    if (phase !== STATUS.SHOW_LEADERBOARD && phase !== STATUS.SHOW_SLIDE) {
      return
    }

    this.advance()
  }

  abortRound(socket: Socket) {
    if (!this.started || !this.isManager(socket)) {
      return
    }

    this.setPaused(false)
    this.abortCooldown()
  }

  togglePause(socket: Socket) {
    if (!this.started || !this.isManager(socket) || !this.round.accepting) {
      return
    }

    this.setPaused(!this.paused)
  }

  // Drops the current question unscored and moves on.
  skipQuestion(socket: Socket) {
    if (!this.started || !this.isManager(socket)) {
      return
    }

    const phase = this.managerPhase

    if (
      phase !== STATUS.SHOW_PREPARED &&
      phase !== STATUS.SHOW_QUESTION &&
      phase !== STATUS.SELECT_ANSWER
    ) {
      return
    }

    this.round.token += 1
    this.round.accepting = false
    this.round.playersAnswers = []
    this.setPaused(false)
    this.abortCooldown()

    this.advance()
  }

  showLeaderboard(socket: Socket) {
    if (!this.started || !this.isManager(socket)) {
      return
    }

    if (this.managerPhase !== STATUS.SHOW_RESPONSES) {
      return
    }

    if (!this.hasNextItem) {
      this.finish()

      return
    }

    const oldLeaderboard = this.tempOldLeaderboard
      ? this.tempOldLeaderboard
      : this.leaderboard

    this.sendStatus(this.manager.id, STATUS.SHOW_LEADERBOARD, {
      oldLeaderboard: oldLeaderboard.slice(0, 5).map(toPublic),
      leaderboard: this.leaderboard.slice(0, 5).map(toPublic),
    })

    this.tempOldLeaderboard = null
  }

  private advance() {
    if (!this.hasNextItem) {
      this.finish()

      return
    }

    this.round.index += 1
    this.newRound()
  }

  private finish() {
    this.started = false
    this.round.token += 1
    this.managerStatus = null

    const ranking = [...this.players].sort((a, b) => b.points - a.points)

    this.broadcastStatus(STATUS.FINISHED, {
      subject: this.quizz.subject,
      top: ranking.slice(0, 3).map(toPublic),
    })
  }
}

export default Game
