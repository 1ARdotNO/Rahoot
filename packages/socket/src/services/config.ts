import { Quizz, QuizzWithId } from "@rahoot/common/types/game"
import fs from "fs"
import { resolve } from "path"
import { randomBytes } from "crypto"

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

    const isImagesExists = fs.existsSync(getPath("quizz/images"))

    if (!isImagesExists) {
      fs.mkdirSync(getPath("quizz/images"), { recursive: true })
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
    const quizzId = id || randomBytes(8).toString("hex")
    const filePath = getPath(`quizz/${quizzId}.json`)

    fs.writeFileSync(filePath, JSON.stringify(quizz, null, 2))

    return { id: quizzId, ...quizz }
  }

  static deleteQuizz(id: string): boolean {
    const filePath = getPath(`quizz/${id}.json`)

    if (!fs.existsSync(filePath)) {
      return false
    }

    fs.unlinkSync(filePath)
    return true
  }

  static saveImage(filename: string, base64Data: string): string {
    const imagesDir = getPath("quizz/images")

    if (!fs.existsSync(imagesDir)) {
      fs.mkdirSync(imagesDir, { recursive: true })
    }

    const ext = filename.split(".").pop() || "png"
    const uniqueName = `${randomBytes(8).toString("hex")}.${ext}`
    const filePath = resolve(imagesDir, uniqueName)

    const buffer = Buffer.from(base64Data, "base64")
    fs.writeFileSync(filePath, buffer)

    return uniqueName
  }

  static getImagesPath(): string {
    return getPath("quizz/images")
  }
}

export default Config
