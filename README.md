<p align="center">
  <img width="450" height="120" align="center" src="https://raw.githubusercontent.com/Ralex91/Rahoot/main/.github/logo.svg">
  <br>
  <div align="center">
    <img alt="Visitor Badge" src="https://api.visitorbadge.io/api/visitors?path=https://github.com/Ralex91/Rahoot/edit/main/README.md&countColor=%2337d67a">
    <img src="https://img.shields.io/docker/pulls/ralex91/rahoot?style=for-the-badge&color=37d67a" alt="Docker Pulls">
  </div>
</p>

## 🧩 What is this project?

Rahoot is a straightforward and open-source clone of the Kahoot! platform, allowing users to host it on their own server for smaller events.

This is a fork of [Ralex91/Rahoot](https://github.com/Ralex91/Rahoot) with extra features (see below). Its Docker image is published as `ghcr.io/1ardotno/rahoot`.

> ⚠️ This project is still under development, please report any bugs or suggestions in the [issues](https://github.com/Ralex91/Rahoot/issues)

<p align="center">
  <img width="30%" src="https://raw.githubusercontent.com/Ralex91/Rahoot/main/.github/preview1.jpg" alt="Login">
  <img width="30%" src="https://raw.githubusercontent.com/Ralex91/Rahoot/main/.github/preview2.jpg" alt="Manager Dashboard">
  <img width="30%" src="https://raw.githubusercontent.com/Ralex91/Rahoot/main/.github/preview3.jpg" alt="Question Screen">
</p>

## ✨ Features

- **Quiz editor** in the browser: create, edit, reorder and delete quizzes, with image upload
- **Question types**: single choice, multiple correct, true/false, typed answer, and slider (number guess with partial points)
- **Info slides** with Markdown between questions
- **Game options**: shuffle questions, shuffle answers, streak bonus, save results
- **Host controls**: pause the timer, skip a question, end answering early
- **Leaderboard commentary**: funny comments about who moved up, down, or stayed on top
- **Bots** with four difficulty levels to fill up a game
- **Saved results** with a per-question breakdown and CSV export
- **Single sign-on** with OIDC (e.g. Pocket ID), with private quizzes and results per user
- **API keys** so OIDC users can let an AI assistant create quizzes for them

## ⚙️ Prerequisites

Choose one of the following deployment methods:

### Without Docker

- Node.js 22 or higher
- pnpm 9 (pinned in `package.json`; with Corepack, run `corepack enable`). Learn more [here](https://pnpm.io/)

### With Docker

- Docker and Docker Compose

## 📖 Getting Started

### 🐳 Using Docker (Recommended)

Using Docker Compose, with the configuration in [compose.yml](/compose.yml):

```bash
docker compose up -d
```

Or using Docker directly:

```bash
docker run -d \
  -p 3000:3000 \
  -p 3001:3001 \
  -v ./config:/app/config \
  -e WEB_ORIGIN=http://localhost:3000 \
  -e SOCKET_URL=http://localhost:3001 \
  ghcr.io/1ardotno/rahoot:latest
```

The `-v ./config:/app/config` volume keeps your settings, quizzes, uploaded images, results and API keys on the host, so they survive container updates and are easy to back up. The folder is created on first run with an example quiz.

The application will be available at:

- Web interface: http://localhost:3000
- Socket server: http://localhost:3001 (WebSocket, uploaded images, and the OIDC login routes)

Browsers need to reach both ports. Behind a reverse proxy, set `WEB_ORIGIN` and `SOCKET_URL` to the public URLs.

### 🛠️ Without Docker

1. Clone the repository:

```bash
git clone https://github.com/1ARdotNO/Rahoot.git
cd ./Rahoot
```

2. Install dependencies:

```bash
pnpm install
```

3. Copy `.env.example` to `.env` and adjust the values

4. Build and start the application:

```bash
# Development mode
pnpm run dev

# Production mode
pnpm run build
pnpm start
```

## ⚙️ Configuration

### Environment variables

| Variable       | Default                 | Description                                                                        |
| -------------- | ----------------------- | ---------------------------------------------------------------------------------- |
| `WEB_ORIGIN`   | `http://localhost:3000` | Public URL of the web interface (allowed CORS origin)                              |
| `SOCKET_URL`   | `http://localhost:3001` | Public URL of the socket server; also used in links to uploaded images             |
| `CONFIG_PATH`  | `config/` in the repo   | Config folder (`/app/config` in Docker)                                            |
| `MANAGER_AUTH` | `password`              | Manager login: `password`, `oidc` or `both` (see [Manager login](#-manager-login)) |
| `OIDC_*`       |                         | Single sign-on settings, see [OIDC](#single-sign-on-with-oidc--pocket-id)          |

### Config folder

```
config/
├── game.json                  # Manager password
├── api-keys.json              # Hashed API keys (created with the first key)
├── quizz/
│   ├── *.json                 # Quizzes of the shared password login
│   ├── images/                # Images uploaded in the editor
│   └── users/<user id>/*.json # Quizzes of each OIDC user
└── results/
    ├── *.json                 # Results of games hosted with the password login
    └── users/<user id>/*.json # Results of each OIDC user's games
```

### Game configuration (`config/game.json`)

```json
{
  "managerPassword": "PASSWORD",
  "music": true
}
```

- `managerPassword`: the shared password for the manager page. **Change it** before exposing the server.
- `music`: written on first start but currently not used.

### Quizzes (`config/quizz/*.json`)

The easiest way to create quizzes is the **quiz editor** on the manager page, but they are plain JSON files you can also write by hand. Files from older versions without a `type` field keep working as single choice questions.

```json
{
  "subject": "Example Quiz",
  "questions": [
    {
      "type": "slide",
      "title": "Welcome!",
      "content": "## Round 1: Geography\n\nGet ready for **maps**."
    },
    {
      "type": "single",
      "question": "What is the capital of Norway?",
      "answers": ["Bergen", "Oslo", "Trondheim", "Stavanger"],
      "image": "https://images.unsplash.com/....",
      "solution": 1,
      "cooldown": 5,
      "time": 20
    },
    {
      "type": "slider",
      "question": "In what year was Oslo founded?",
      "min": 900,
      "max": 1200,
      "step": 1,
      "solution": 1040,
      "tolerance": 20,
      "cooldown": 5,
      "time": 20
    }
  ]
}
```

- `subject`: title of the quiz (max 200 characters)
- `questions`: 1 to 200 items, at least one of which must be a question

Every question has these fields:

| Field      | Description                                                   |
| ---------- | ------------------------------------------------------------- |
| `type`     | One of the types below; defaults to `single`                  |
| `question` | The question text (max 500 characters)                        |
| `cooldown` | Seconds the question is shown before answering opens (1–60)   |
| `time`     | Seconds players have to answer (1–600)                        |
| `image`    | Optional image URL                                            |
| `video`    | Optional video URL, played on the host screen while answering |
| `audio`    | Optional audio URL, played on the host screen while answering |

Item types:

| Type        | Extra fields                                                        | Scoring                                                                       |
| ----------- | ------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| `single`    | `answers` (2–4, max 200 characters each), `solution` (0-based index) | Correct answer                                                               |
| `multiple`  | `answers` (2–4), `solutions` (array of indexes)                     | Exactly the correct set                                                       |
| `truefalse` | `solution` (`true` or `false`)                                      | Correct answer                                                                |
| `typed`     | `acceptedAnswers` (array of strings)                                | Ignores case, extra spaces and trailing punctuation                           |
| `slider`    | `min`, `max`, `step`, `solution`, `tolerance` (optional, default 0) | Within tolerance is correct; partial points down to 0 at ¼ of the range away  |
| `slide`     | `content` (Markdown), optional `title` and `image`                  | Not scored and not counted as a question; the host clicks Next to continue    |

Points depend on speed: up to 1000 for an instant correct answer, dropping to 0 at the end of the timer.

**Images** can be uploaded in the editor (PNG, JPEG, GIF or WebP, up to 5 MB). They are stored in `config/quizz/images/` and served by the socket server.

## 🔐 Manager login

### Shared password (default)

With `MANAGER_AUTH=password` (the default) the manager page asks for `managerPassword` from `config/game.json`. Everyone using the password shares the quizzes in `config/quizz/`.

Logins last 12 hours and survive page reloads. Sessions are kept in memory, so restarting the server logs everyone out.

### Single sign-on with OIDC / Pocket ID

You can also log in with an OpenID Connect provider such as [Pocket ID](https://pocket-id.org). Each OIDC user gets private quizzes and results in `users/<user id>/` folders; the shared password login keeps using the top-level folders.

1. In Pocket ID, create an OIDC client with the callback URL `<SOCKET_URL>/auth/callback` (e.g. `https://rahoot-socket.example.com/auth/callback`).
2. Set the environment variables:

| Variable              | Description                                                                 |
| --------------------- | --------------------------------------------------------------------------- |
| `MANAGER_AUTH`        | `oidc` (single sign-on only) or `both` (single sign-on and password)        |
| `OIDC_ISSUER`         | Your provider URL, e.g. `https://id.example.com`                            |
| `OIDC_CLIENT_ID`      | Client ID from the provider                                                 |
| `OIDC_CLIENT_SECRET`  | Client secret; omit for a public client (PKCE is always used)               |
| `OIDC_ALLOWED_GROUPS` | Optional comma-separated groups allowed to log in (requests `groups` scope) |
| `OIDC_SCOPES`         | Optional, default `openid profile email`                                    |
| `OIDC_REDIRECT_URI`   | Optional override; defaults to `<SOCKET_URL>/auth/callback`                 |
| `OIDC_PROVIDER_NAME`  | Login button label, default `Pocket ID`                                     |

- `WEB_ORIGIN` must be the real web URL (not `*`) when OIDC is enabled; the server refuses to start otherwise.
- If `OIDC_ALLOWED_GROUPS` is not set, **every account on your provider can manage quizzes**. Set it, or restrict the client to a group in Pocket ID.
- To give an OIDC user an existing shared quiz, copy its file into their `config/quizz/users/<user id>/` folder.

### API keys

OIDC users can create API keys under **🔑 API keys** on the manager page, for example to let an AI assistant write quizzes.

- A key logs in as its owner: paste it into the login field (labelled "API key" in `oidc`-only mode), or use it with the [quiz API](#-quiz-api-for-scripts-and-ai-assistants).
- The key is shown once. Only a hash is stored, in `config/api-keys.json`.
- Each user can have up to 10 keys, see when each was last used, and revoke them at any time.
- A key can't be used to create, list or revoke keys.
- Removing someone from `OIDC_ALLOWED_GROUPS` does **not** revoke their keys. Revoke them too, or delete their entries from `api-keys.json`.

## 🎮 Hosting a game

1. Open the manager page at http://localhost:3000/manager and log in
2. Pick a quiz, choose the game options, and click **Start Game**
3. Share the game URL and PIN (or the QR code) with the players
4. Optionally add bots, then click **Start Game** once everyone has joined

### Game options

| Option            | Effect                                                                                                       |
| ----------------- | ------------------------------------------------------------------------------------------------------------ |
| Shuffle questions | Randomises question order; info slides stay in place and questions shuffle within each section between them |
| Shuffle answers   | Randomises answer order for choice questions (the same order for everyone)                                  |
| Streak bonus      | +100 points per consecutive correct answer, up to +500                                                      |
| Save results      | On by default; keeps a record of the game (see [Results](#-results))                                        |

### During the game

- **Pause / Resume** stops the answer timer. Players can't answer while paused, and paused time doesn't cost points.
- **Skip question** moves on without scoring the question.
- **Show results** ends answering early.
- Players who answer wrong see the correct answer on their device.
- Between questions the leaderboard shows up to two funny comments about the round, for example a new leader, a big climb or fall, a close race, or a hot streak.

### Bots

On the join screen the host can add up to 20 bot players (🤖 Sparky, 🤖 Chip, …) and choose a difficulty for each. Click a bot to remove it. Bots can only be added before the game starts.

| Difficulty | Correct | Answers after (share of the timer) | Sometimes doesn't answer |
| ---------- | ------- | ---------------------------------- | ------------------------ |
| Easy       | ~35%    | 35–95%                             | 10%                      |
| Medium     | ~60%    | 20–80%                             | 4%                       |
| Hard       | ~82%    | 10–55%                             | 1%                       |
| Genius     | ~96%    | 5–30%                              | never                    |

Bots score like players, wait while the game is paused, and are marked as bots in saved results.

## 📊 Results

Games are saved by default. Each result has the final ranking and every player's answer, correctness and points for every question, plus skipped questions. Results are written after each question, so a game that is abandoned or interrupted is kept as **Unfinished**.

Open **📊 Results** on the manager page to browse them, see a per-question breakdown, download a CSV (opens in Excel), or delete them. OIDC users only see the results of games they hosted.

## 🤖 Quiz API for scripts and AI assistants

The manager page talks to the socket server over [Socket.IO](https://socket.io) v4, and scripts can do the same. OIDC users can copy ready-made instructions for an AI assistant from the **🔑 API keys** panel.

```js
import { io } from "socket.io-client"

const socket = io("http://localhost:3001", {
  auth: { clientId: crypto.randomUUID() },
})

socket.on("manager:errorMessage", console.error)
socket.on("manager:quizzList", (list) => console.log(list)) // [{ id, subject }]
socket.on("manager:quizzSaved", (quizz) => console.log("saved", quizz.id))

socket.emit("manager:auth", "rahoot_your_api_key") // or the manager password
socket.emit("manager:saveQuizz", {
  // id: "existing-id", // include to overwrite an existing quiz
  quizz: { subject: "My quiz", questions: [/* items as described above */] },
  images: [],
})
```

| Event (emit)          | Payload                      | Response event                              |
| --------------------- | ---------------------------- | ------------------------------------------- |
| `manager:auth`        | password or API key          | `manager:session`, then `manager:quizzList` |
| `manager:getQuizz`    | quiz id                      | `manager:quizzData`                         |
| `manager:saveQuizz`   | `{ id?, quizz, images: [] }` | `manager:quizzSaved`, `manager:quizzList`   |
| `manager:deleteQuizz` | quiz id                      | `manager:quizzDeleted`, `manager:quizzList` |
| `manager:getResults`  |                              | `manager:resultsList`                       |
| `manager:getResult`   | result id                    | `manager:resultData`                        |

Errors are sent as `manager:errorMessage`. Quizzes are validated on save, and the error message names the item and field that failed.

## 📝 Contributing

1. Fork the repository
2. Create a new branch (e.g., `feat/my-feature`)
3. Make your changes
4. Create a pull request
5. Wait for review and merge

For bug reports or feature requests, please [create an issue](https://github.com/Ralex91/Rahoot/issues).

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Ralex91/Rahoot&type=date&legend=bottom-right)](https://www.star-history.com/#Ralex91/Rahoot&type=date&legend=bottom-right)
