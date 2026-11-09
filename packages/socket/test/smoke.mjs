// End-to-end smoke test: boots the built socket server and plays a complete game.
// Run after `pnpm build`; exits non-zero on the first failure.
import assert from "node:assert/strict"
import { spawn } from "node:child_process"
import fs from "node:fs"
import os from "node:os"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { io } from "socket.io-client"

const PORT = 3001
const URL = `http://localhost:${PORT}`
const here = path.dirname(fileURLToPath(import.meta.url))
const configDir = fs.mkdtempSync(path.join(os.tmpdir(), "rahoot-smoke-"))
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
  "base64",
)

// Server output goes to a file, not a pipe, so the child can't hit EPIPE after we exit.
const logFile = path.join(os.tmpdir(), `rahoot-smoke-${process.pid}.log`)
const server = spawn(process.execPath, [path.join(here, "../dist/index.cjs")], {
  env: { ...process.env, CONFIG_PATH: configDir, MANAGER_AUTH: "password" },
  stdio: ["ignore", fs.openSync(logFile, "w"), "inherit"],
})
const serverLog = () => fs.readFileSync(logFile, "utf-8")

const sockets = []
const trace = []
const cleanup = (code) => {
  sockets.forEach((s) => s.disconnect())
  server.kill()
  fs.rmSync(configDir, { recursive: true, force: true })
  fs.rmSync(logFile, { force: true })
  process.exit(code)
}
const fail = (error) => {
  console.error(`✗ ${error.stack ?? error}`)
  console.error(`screens seen: ${trace.join(" ")}`)
  console.error("--- server output ---\n" + serverLog().slice(-3000))
  cleanup(1)
}
process.on("unhandledRejection", fail)
setTimeout(() => fail(new Error("smoke test timed out")), 120_000).unref()

const ok = (message) => console.log(`✓ ${message}`)
process.on("uncaughtException", fail)
const connect = () => {
  const socket = io(URL, { auth: { clientId: crypto.randomUUID() }, forceNew: true })
  sockets.push(socket)

  return socket
}
const once = (socket, event, predicate = () => true, ms = 20_000) =>
  new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`timed out waiting for ${event}`)), ms)
    const handler = (data) => {
      if (predicate(data)) {
        clearTimeout(timer)
        socket.off(event, handler)
        resolve(data)
      }
    }
    socket.on(event, handler)
  })
const status = (socket, name) => once(socket, "game:status", (s) => s.name === name)

for (let i = 0; i < 50 && !serverLog().includes("running"); i += 1) {
  await new Promise((r) => setTimeout(r, 100))
}
ok("server started")

const host = connect()
let step = 0
host.on("game:status", (s) => (step = s.step))
const act = (event, gameId) => host.timeout(5000).emitWithAck(event, { gameId, step })

host.emit("manager:auth", "wrong")
assert.equal(await once(host, "manager:errorMessage"), "Invalid password")
host.emit("manager:saveQuizz", { quizz: { subject: "x", questions: [] }, images: [] })
assert.equal(await once(host, "manager:errorMessage"), "Unauthorized")
host.emit("manager:auth", "PASSWORD")
await once(host, "manager:quizzList")
ok("manager auth")

const timing = { cooldown: 1, time: 4 }
host.emit("manager:saveQuizz", {
  id: "smoke",
  images: [{ questionIndex: 1, data: PNG.toString("base64") }],
  quizz: {
    subject: "Smoke",
    questions: [
      { type: "slide", title: "Welcome", content: "**Hi**" },
      { ...timing, type: "single", question: "single", answers: ["a", "b"], solution: 1 },
      { ...timing, type: "single", question: "either", answers: ["a", "b", "c"], solution: 0, alsoCorrect: [2] },
      { ...timing, type: "multiple", question: "multi", answers: ["a", "b", "c"], solutions: [0, 2] },
      { ...timing, type: "truefalse", question: "tf", solution: false },
      { ...timing, type: "typed", question: "typed", acceptedAnswers: ["Oslo"] },
      { ...timing, type: "slider", question: "slider", min: 0, max: 100, step: 1, solution: 40, tolerance: 2 },
    ],
  },
})
const saved = await once(host, "manager:quizzSaved")
const imageResponse = await fetch(saved.questions[1].image)
assert.equal(imageResponse.status, 200)
assert.equal(imageResponse.headers.get("content-type"), "image/png")
host.emit("manager:saveQuizz", { quizz: { subject: "bad", questions: [{ type: "single", question: "q", answers: ["one"], solution: 0, ...timing }] }, images: [] })
assert.match(await once(host, "manager:errorMessage"), /^Invalid quizz/)
host.emit("manager:saveQuizz", { quizz: { subject: "bad", questions: [{ type: "single", question: "q", answers: ["a", "b"], solution: 0, alsoCorrect: [0], ...timing }] }, images: [] })
assert.match(await once(host, "manager:errorMessage"), /alsoCorrect/)
ok("quiz save, validation, image upload and serving")

host.emit("game:create", { quizzId: "smoke", options: { streakBonus: true } })
const { gameId, inviteCode } = await once(host, "manager:gameCreated")
host.emit("manager:addBot", { gameId, difficulty: "genius" })
const bot = await once(host, "manager:newPlayer")
assert.ok(bot.bot)

const player = connect()
player.emit("player:join", inviteCode)
await once(player, "game:successRoom")
player.emit("player:login", { gameId, data: { username: "Smoky" } })
await once(player, "game:successJoin")
ok("game created, bot added, player joined")

const slide = status(host, "SHOW_SLIDE")
assert.equal((await act("manager:startGame", gameId)).ok, true)
await slide
const stale = await host.timeout(5000).emitWithAck("manager:nextQuestion", { gameId, step: step - 1 })
assert.equal(stale.stale, true)
assert.equal((await act("manager:nextQuestion", gameId)).ok, true)
ok("start, slide, stale host click rejected")

const answers = [1, 2, [0, 2], 1, "oslo", 41]
const results = []
player.on("game:status", (s) => trace.push(`P:${s.name}`))
host.on("game:status", (s) => trace.push(`H:${s.name}`))

player.on("game:status", (s) => s.name === "SHOW_RESULT" && results.push(s.data))

// The server pushes the next screen before acknowledging an action, so every
// wait is registered before the action that triggers it.
let finished = null

for (const [index, answer] of answers.entries()) {
  const isLast = index === answers.length - 1

  await status(player, "SELECT_ANSWER")
  const responses = status(host, "SHOW_RESPONSES")
  player.emit("player:selectedAnswer", { gameId, data: { answer } })
  await responses

  const after = status(host, isLast ? "FINISHED" : "SHOW_LEADERBOARD")
  assert.equal((await act("manager:showLeaderboard", gameId)).ok, true)
  const screen = await after

  if (isLast) {
    finished = screen
  } else {
    assert.ok(Array.isArray(screen.data.commentary))
    assert.equal((await act("manager:nextQuestion", gameId)).ok, true)
  }
}

assert.equal(results.length, 6)
assert.ok(results.every((r) => r.correct), "player answered every question correctly")
assert.deepEqual(results.map((r) => r.streak), [1, 2, 3, 4, 5, 6])
assert.equal(finished.data.top.length, 2)
ok("all five question types and alsoCorrect scored, streaks counted, podium shown")

await new Promise((r) => setTimeout(r, 300))
const resultFiles = fs.readdirSync(path.join(configDir, "results"))
const record = JSON.parse(fs.readFileSync(path.join(configDir, "results", resultFiles[0]), "utf-8"))
assert.equal(record.completed, true)
assert.equal(record.rounds.length, 6)
ok("results saved")

console.log("\nSmoke test passed")
cleanup(0)
