import { Server as ServerIO, Socket as SocketIO } from "socket.io"
import {
  ApiKeyInfo,
  AnswerValue,
  BotDifficulty,
  GameOptions,
  GameUpdateQuestion,
  Player,
  Quizz,
  QuizzSummary,
  QuizzWithId,
} from "."
import { GameResult, GameResultSummary } from "./results"
import { Status, StatusDataMap } from "./status"

export type Server = ServerIO<ClientToServerEvents, ServerToClientEvents>
export type Socket = SocketIO<ClientToServerEvents, ServerToClientEvents>

export type Message<K extends keyof StatusDataMap = keyof StatusDataMap> = {
  gameId?: string
  status: K
  data: StatusDataMap[K]
}

export type MessageWithoutStatus<T = any> = {
  gameId?: string
  data: T
}

export type MessageGameId = {
  gameId?: string
}

export interface ServerToClientEvents {
  connect: () => void

  // Game events
  "game:status": (_data: { name: Status; data: StatusDataMap[Status] }) => void
  "game:successRoom": (_data: string) => void
  "game:successJoin": (_gameId: string) => void
  "game:totalPlayers": (_count: number) => void
  "game:errorMessage": (_message: string) => void
  "game:startCooldown": () => void
  "game:cooldown": (_count: number) => void
  "game:reset": (_message: string) => void
  "game:updateQuestion": (_data: { current: number; total: number }) => void
  "game:playerAnswer": (_count: number) => void
  "game:paused": (_paused: boolean) => void

  // Player events
  "player:successReconnect": (_data: {
    gameId: string
    status: { name: Status; data: StatusDataMap[Status] }
    player: { username: string; points: number }
    currentQuestion: GameUpdateQuestion
  }) => void
  "player:updateLeaderboard": (_data: { leaderboard: Player[] }) => void

  // Manager events
  "manager:successReconnect": (_data: {
    gameId: string
    status: { name: Status; data: StatusDataMap[Status] }
    players: Player[]
    currentQuestion: GameUpdateQuestion
  }) => void
  "manager:quizzList": (_quizzList: QuizzSummary[]) => void
  "manager:authMethods": (_methods: {
    password: boolean
    apiKeys: boolean
    oidc: { name: string } | null
  }) => void
  // `token` is only sent when a new session is created, not on resume.
  "manager:session": (_session: {
    name: string
    token?: string
    canManageApiKeys: boolean
  }) => void
  "manager:apiKeys": (_keys: ApiKeyInfo[]) => void
  "manager:apiKeyCreated": (_data: { key: string; info: ApiKeyInfo }) => void
  "manager:sessionExpired": () => void
  "manager:resultsList": (_results: GameResultSummary[]) => void
  "manager:resultData": (_result: GameResult) => void
  "manager:quizzData": (_quizz: QuizzWithId) => void
  "manager:quizzSaved": (_quizz: QuizzWithId) => void
  "manager:quizzDeleted": (_quizzId: string) => void
  "manager:gameCreated": (_data: { gameId: string; inviteCode: string }) => void
  "manager:statusUpdate": (_data: {
    status: Status
    data: StatusDataMap[Status]
  }) => void
  "manager:newPlayer": (_player: Player) => void
  "manager:removePlayer": (_playerId: string) => void
  "manager:errorMessage": (_message: string) => void
  "manager:playerKicked": (_playerId: string) => void
}

export interface ClientToServerEvents {
  // Manager actions
  "game:create": (_data: { quizzId: string; options: GameOptions }) => void
  "manager:auth": (_password: string) => void
  "manager:authMethods": () => void
  "manager:oidcHandoff": (_code: string) => void
  "manager:resume": (_token: string) => void
  "manager:logout": (_token?: string) => void
  "manager:listApiKeys": () => void
  "manager:createApiKey": (_label: string) => void
  "manager:revokeApiKey": (_id: string) => void
  "manager:reconnect": (_message: { gameId: string }) => void
  "manager:kickPlayer": (_message: { gameId: string; playerId: string }) => void
  "manager:addBot": (_message: { gameId: string; difficulty: BotDifficulty }) => void
  "manager:startGame": (_message: MessageGameId) => void
  "manager:abortQuiz": (_message: MessageGameId) => void
  "manager:nextQuestion": (_message: MessageGameId) => void
  "manager:showLeaderboard": (_message: MessageGameId) => void
  "manager:togglePause": (_message: MessageGameId) => void
  "manager:skipQuestion": (_message: MessageGameId) => void

  // Quiz management
  "manager:getQuizz": (_quizzId: string) => void
  "manager:saveQuizz": (_data: {
    id?: string
    quizz: Quizz
    images: { questionIndex: number; data: string }[]
  }) => void
  "manager:deleteQuizz": (_quizzId: string) => void

  // Results
  "manager:getResults": () => void
  "manager:getResult": (_resultId: string) => void
  "manager:deleteResult": (_resultId: string) => void

  // Player actions
  "player:join": (_inviteCode: string) => void
  "player:login": (_message: MessageWithoutStatus<{ username: string }>) => void
  "player:reconnect": (_message: { gameId: string }) => void
  "player:selectedAnswer": (
    _message: MessageWithoutStatus<{ answer: AnswerValue }>
  ) => void

  // Common
  disconnect: () => void
}
