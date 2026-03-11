# Quiz Creator Feature - Implementation Plan

## Overview
Add a quiz creation/editing UI to the manager page, allowing managers to create quizzes with drag-and-drop image uploads. Quizzes are saved as JSON files to `config/quizz/` (same location as existing quizzes). Images are stored in `config/quizz/images/` and served via a new static file route.

## Architecture

### Backend (Socket Server)
1. **New socket events** in `packages/socket/src/index.ts`:
   - `manager:saveQuizz` — receives quiz JSON + images (base64), writes to `config/quizz/<id>.json`, saves images to `config/quizz/images/`
   - `manager:deleteQuizz` — deletes a quiz JSON file
   - `manager:getQuizz` — returns a single quiz for editing

2. **Config service additions** in `packages/socket/src/services/config.ts`:
   - `saveQuizz(id, data)` — write quiz JSON to disk
   - `deleteQuizz(id)` — remove quiz file
   - `saveImage(filename, base64data)` — save image to `config/quizz/images/`
   - `getImagePath()` — return path to images dir

3. **Image serving** — Add Express static middleware or a simple HTTP handler to serve images from `config/quizz/images/` on the socket server (port 3001), OR use a Next.js API route.

### Frontend (Web)
4. **New component: `QuizzEditor`** in `packages/web/src/components/game/create/QuizzEditor.tsx`:
   - Quiz subject/title input
   - Add/remove/reorder questions
   - Per-question: question text, 2-4 answers, correct answer selector, cooldown, time
   - Drag-and-drop image upload zone per question
   - Save & Cancel buttons

5. **Manager page update** in `packages/web/src/app/(auth)/manager/page.tsx`:
   - Add "Create Quiz" button alongside quiz list
   - Add "Edit" and "Delete" buttons per quiz
   - Toggle between SelectQuizz view and QuizzEditor view

6. **Socket type updates** in `packages/common/src/types/game/socket.ts`:
   - Add new events to `ClientToServerEvents` and `ServerToClientEvents`

### Docker & Deployment
7. **Dockerfile update**: ensure `config/quizz/images/` directory is created and writable
8. **Build & push** Docker image to `ghcr.io/1ardotno/rahoot`

## File Changes

| File | Action |
|------|--------|
| `packages/common/src/types/game/socket.ts` | Add new socket events |
| `packages/socket/src/services/config.ts` | Add save/delete/image methods |
| `packages/socket/src/index.ts` | Add new socket event handlers |
| `packages/web/src/app/(auth)/manager/page.tsx` | Add create/edit/delete UI flow |
| `packages/web/src/components/game/create/SelectQuizz.tsx` | Add edit/delete buttons per quiz |
| `packages/web/src/components/game/create/QuizzEditor.tsx` | **NEW** - Full quiz editor component |
| `Dockerfile` | Ensure images dir exists |

## Task Order
1. Add socket event types (common package)
2. Add backend save/delete/image methods (socket package)
3. Add socket event handlers (socket package)
4. Build QuizzEditor component (web package)
5. Update manager page and SelectQuizz (web package)
6. Update Dockerfile
7. Commit, push, build Docker image
