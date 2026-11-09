import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import fs from "fs"
import { resolve } from "path"
import { quizzIdValidator } from "@rahoot/common/validators/quizz"
import { randomBytes } from "crypto"

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024

const detectImageExtension = (buffer: Buffer): string | null => {
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "png"
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return "jpg"
  }

  if (buffer.subarray(0, 4).toString("ascii") === "GIF8") {
    return "gif"
  }

  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return "webp"
  }

  return null
}

const inContainerPath = process.env.CONFIG_PATH

const getPath = (path: string = "") =>
  inContainerPath
    ? resolve(inContainerPath, path)
    : resolve(process.cwd(), "../../config", path)

class Config {
  static init() {
    const isConfigFolderExists = fs.existsSync(getPath())

    if (!isConfigFolderExists) {
      fs.mkdirSync(getPath())
    }

    const isGameConfigExists = fs.existsSync(getPath("game.json"))

    if (!isGameConfigExists) {
      fs.writeFileSync(
        getPath("game.json"),
        JSON.stringify(
          {
            managerPassword: "PASSWORD",
            music: true,
          },
          null,
          2
        )
      )
    }

    const isQuizzExists = fs.existsSync(getPath("quizz"))

    if (!isQuizzExists) {
      fs.mkdirSync(getPath("quizz"))

      fs.writeFileSync(
        getPath("quizz/example.json"),
        JSON.stringify(
          {
            subject: "Example Quizz",
            questions: [
              {
                question: "What is good answer ?",
                answers: ["No", "Good answer", "No", "No"],
                solution: 1,
                cooldown: 5,
                time: 15,
              },
              {
                question: "What is good answer with image ?",
                answers: ["No", "No", "No", "Good answer"],
                image: "https://placehold.co/600x400.png",
                solution: 3,
                cooldown: 5,
                time: 20,
              },
              {
                question: "What is good answer with two answers ?",
                answers: ["Good answer", "No"],
                image: "https://placehold.co/600x400.png",
                solution: 0,
                cooldown: 5,
                time: 20,
              },
            ],
          },
          null,
          2
        )
      )
    }

    if (!fs.existsSync(getPath("quizz/images"))) {
      fs.mkdirSync(getPath("quizz/images"), { recursive: true })
    }
  }

  static game() {
    const isExists = fs.existsSync(getPath("game.json"))

    if (!isExists) {
      throw new Error("Game config not found")
    }

    try {
      const config = fs.readFileSync(getPath("game.json"), "utf-8")

      return JSON.parse(config)
    } catch (error) {
      console.error("Failed to read game config:", error)
    }

    return {}
  }

  static quizz() {
    const isExists = fs.existsSync(getPath("quizz"))

    if (!isExists) {
      return []
    }

    try {
      const files = fs
        .readdirSync(getPath("quizz"))
        .filter((file) => file.endsWith(".json"))

      const quizz: QuizzWithId[] = files.map((file) => {
        const data = fs.readFileSync(getPath(`quizz/${file}`), "utf-8")
        const config = JSON.parse(data)

        const id = file.replace(".json", "")

        return {
          id,
          ...config,
        }
      })

      return quizz || []
    } catch (error) {
      console.error("Failed to read quizz config:", error)

      return []
    }
  }

  static getQuizz(id: string): QuizzWithId | null {
    if (!quizzIdValidator.safeParse(id).success) {
      return null
    }

    const filePath = getPath(`quizz/${id}.json`)

    if (!fs.existsSync(filePath)) {
      return null
    }

    try {
      const data = fs.readFileSync(filePath, "utf-8")

      return { id, ...JSON.parse(data) }
    } catch (error) {
      console.error("Failed to read quizz:", error)

      return null
    }
  }

  static saveQuizz(id: string | undefined, quizz: Quizz): QuizzWithId {
    const quizzId = id ?? randomBytes(8).toString("hex")
    quizzIdValidator.parse(quizzId)

    fs.writeFileSync(
      getPath(`quizz/${quizzId}.json`),
      JSON.stringify(quizz, null, 2),
    )

    return { id: quizzId, ...quizz }
  }

  static deleteQuizz(id: string): boolean {
    if (!quizzIdValidator.safeParse(id).success) {
      return false
    }

    const filePath = getPath(`quizz/${id}.json`)

    if (!fs.existsSync(filePath)) {
      return false
    }

    fs.unlinkSync(filePath)

    return true
  }

  // Extension comes from the file's magic bytes, never the client filename,
  // so uploads can't be served back as HTML or SVG.
  static saveImage(base64Data: string): string {
    const buffer = Buffer.from(base64Data, "base64")
    const ext = detectImageExtension(buffer)

    if (!ext) {
      throw new Error("Unsupported image format")
    }

    if (buffer.length > MAX_IMAGE_BYTES) {
      throw new Error("Image too large")
    }

    const uniqueName = `${randomBytes(8).toString("hex")}.${ext}`
    fs.writeFileSync(resolve(getPath("quizz/images"), uniqueName), buffer)

    return uniqueName
  }

  static getImagesPath(): string {
    return getPath("quizz/images")
  }
}

export default Config
