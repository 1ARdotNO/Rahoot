export const agentInstructions = (
  socketUrl: string,
  apiKey: string,
) => `Rahoot quiz API (Socket.IO v4, e.g. the socket.io-client npm package)

Server: ${socketUrl}
API key: ${apiKey}

1. Connect: io("${socketUrl}", { auth: { clientId: "<any random uuid>" } })
2. Log in: emit("manager:auth", "<API key>")
   -> receive "manager:session", then "manager:quizzList" ([{ id, subject }]).
   Errors arrive as "manager:errorMessage" (string).
3. Read a quiz: emit("manager:getQuizz", "<id>") -> "manager:quizzData"
4. Create or update: emit("manager:saveQuizz", { id?: "<id to overwrite>", quizz, images: [] })
   -> "manager:quizzSaved" (the saved quiz incl. its id). Omit id to create a new quiz.

Quiz format: { "subject": "Title", "questions": [ ...items ] }  (1-200 items, at least one question)
Every question has: "question" (max 500 chars), "cooldown" (seconds to read, 1-60),
"time" (seconds to answer, 1-600), optional "image" (URL). Answer texts max 200 chars.

- Single choice: { "type": "single", "answers": ["A","B","C","D"], "solution": 1 }   (2-4 answers, 0-based index)
- Multiple correct: { "type": "multiple", "answers": [...], "solutions": [0, 2] }
- True/false: { "type": "truefalse", "solution": true }
- Typed answer: { "type": "typed", "acceptedAnswers": ["Oslo", "Christiania"] }   (case-insensitive)
- Slider: { "type": "slider", "min": 0, "max": 100, "step": 1, "solution": 42, "tolerance": 2 }
- Info slide (not scored): { "type": "slide", "title": "Round 2", "content": "Markdown **text**" }

Example item: { "type": "single", "question": "Capital of Norway?", "answers": ["Bergen","Oslo","Trondheim"], "solution": 1, "cooldown": 5, "time": 20 }
`
