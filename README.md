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

> ⚠️ This project is still under development, please report any bugs or suggestions in the [issues](https://github.com/Ralex91/Rahoot/issues)

<p align="center">
  <img width="30%" src="https://raw.githubusercontent.com/Ralex91/Rahoot/main/.github/preview1.jpg" alt="Login">
  <img width="30%" src="https://raw.githubusercontent.com/Ralex91/Rahoot/main/.github/preview2.jpg" alt="Manager Dashboard">
  <img width="30%" src="https://raw.githubusercontent.com/Ralex91/Rahoot/main/.github/preview3.jpg" alt="Question Screen">
</p>

## ⚙️ Prerequisites

Choose one of the following deployment methods:

### Without Docker

- Node.js : version 20 or higher
- PNPM : Learn more about [here](https://pnpm.io/)

### With Docker

- Docker and Docker Compose

## 📖 Getting Started

Choose your deployment method:

### 🐳 Using Docker (Recommended)

Using Docker Compose (recommended):
You can find the docker compose configuration in the repository:
[docker-compose.yml](/compose.yml)

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
  ralex91/rahoot:latest
```

**Configuration Volume:**
The `-v ./config:/app/config` option mounts a local `config` folder to persist your game settings and quizzes. This allows you to:

- Edit your configuration files directly on your host machine
- Keep your settings when updating the container
- Easily backup your quizzes and game configuration

The folder will be created automatically on first run with an example quiz to get you started.

The application will be available at:

- Web Interface: http://localhost:3000
- WebSocket Server: ws://localhost:3001

### 🛠️ Without Docker

1. Clone the repository:

```bash
git clone https://github.com/Ralex91/Rahoot.git
cd ./Rahoot
```

2. Install dependencies:

```bash
pnpm install
```

3. Change the environment variables in the `.env` file

4. Build and start the application:

```bash
# Development mode
pnpm run dev

# Production mode
pnpm run build
pnpm start
```

## ⚙️ Configuration

The configuration is split into two main parts:

### 1. Game Configuration (`config/game.json`)

Main game settings:

```json
{
  "managerPassword": "PASSWORD",
  "music": true
}
```

Options:

- `managerPassword`: The master password for accessing the manager interface
- `music`: Enable/disable game music

### 2. Quiz Configuration (`config/quizz/*.json`)

Create your quiz files in the `config/quizz/` directory. You can have multiple quiz files and select which one to use when starting a game.

Example quiz configuration (`config/quizz/example.json`):

```json
{
  "subject": "Example Quiz",
  "questions": [
    {
      "question": "What is the correct answer?",
      "answers": ["No", "Yes", "No", "No"],
      "image": "https://images.unsplash.com/....",
      "solution": 1,
      "cooldown": 5,
      "time": 15
    }
  ]
}
```

Quiz Options:

- `subject`: Title/topic of the quiz
- `questions`: Array of question objects containing:
  - `question`: The question text
  - `answers`: Array of possible answers (2-4 options)
  - `image`: Optional URL for question image
  - `solution`: Index of correct answer (0-based)
  - `cooldown`: Time in seconds before showing the question
  - `time`: Time in seconds allowed to answer
  - `type`: Optional, defaults to `single` (see below)

Quizzes can also be created and edited from the manager page.

Item types (`type` field):

| Type        | Extra fields                                                                       | Scoring                                                        |
| ----------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| `single`    | `answers`, `solution` (index)                                                      | Correct answer                                                 |
| `multiple`  | `answers`, `solutions` (array of indexes)                                          | Exactly the correct set                                        |
| `truefalse` | `solution` (`true`/`false`)                                                        | Correct answer                                                 |
| `typed`     | `acceptedAnswers` (array of strings)                                               | Case and whitespace insensitive match                          |
| `slider`    | `min`, `max`, `step`, `solution`, `tolerance` (optional, default 0)                | Within tolerance is correct; partial points up to ¼ range away |
| `slide`     | `title` (optional), `content` (Markdown), `image` (optional); no question fields    | Not scored; the host advances it                               |

```json
{ "type": "slide", "title": "Round 2", "content": "## Geography\n\nGet ready for **maps**!" }
```

Game options (chosen when starting a game): shuffle questions (within the sections between slides), shuffle answers, and a streak bonus (+100 per consecutive correct answer, up to +500). During a question the host can pause the timer or skip the question.

### 3. Manager login with OIDC / Pocket ID (optional)

By default the manager page uses the shared `managerPassword`. You can also log in with an OpenID Connect provider such as [Pocket ID](https://pocket-id.org). Each OIDC user gets a private quiz folder at `config/quizz/users/<user id>/`. The shared password login keeps using `config/quizz/`.

1. In Pocket ID, create an OIDC client with the callback URL `<SOCKET_URL>/auth/callback` (e.g. `https://rahoot-socket.example.com/auth/callback`).
2. Set the environment variables:

| Variable              | Description                                                                  |
| --------------------- | ---------------------------------------------------------------------------- |
| `MANAGER_AUTH`        | `password` (default), `oidc` (SSO only), or `both`                           |
| `OIDC_ISSUER`         | Your provider URL, e.g. `https://id.example.com`                             |
| `OIDC_CLIENT_ID`      | Client ID from the provider                                                  |
| `OIDC_CLIENT_SECRET`  | Client secret; omit for a public client (PKCE is always used)                |
| `OIDC_ALLOWED_GROUPS` | Optional comma-separated groups allowed to log in (requests `groups` scope)  |
| `OIDC_REDIRECT_URI`   | Optional override; defaults to `<SOCKET_URL>/auth/callback`                  |
| `OIDC_PROVIDER_NAME`  | Login button label, default `Pocket ID`                                      |

`WEB_ORIGIN` must be the real web URL (not `*`) when OIDC is enabled. If `OIDC_ALLOWED_GROUPS` is not set, every account on your provider can manage quizzes, so either set it or restrict the client to a group in Pocket ID. Login sessions are kept in memory and last 12 hours, so restarting the server logs everyone out.

## 🎮 How to Play

1. Access the manager interface at http://localhost:3000/manager
2. Enter the manager password (defined in quiz config)
3. Share the game URL (http://localhost:3000) and room code with participants
4. Wait for players to join
5. Click the start button to begin the game

## 📝 Contributing

1. Fork the repository
2. Create a new branch (e.g., `feat/my-feature`)
3. Make your changes
4. Create a pull request
5. Wait for review and merge

For bug reports or feature requests, please [create an issue](https://github.com/Ralex91/Rahoot/issues).

## ⭐ Star History

[![Star History Chart](https://api.star-history.com/svg?repos=Ralex91/Rahoot&type=date&legend=bottom-right)](https://www.star-history.com/#Ralex91/Rahoot&type=date&legend=bottom-right)
