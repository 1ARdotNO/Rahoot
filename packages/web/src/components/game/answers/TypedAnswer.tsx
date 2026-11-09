import Button from "@rahoot/web/components/Button"
import Input from "@rahoot/web/components/Input"
import { FormEvent, useState } from "react"

type Props = {
  onSubmit?: (_answer: string) => void
}

const MAX_LENGTH = 100

const TypedAnswer = ({ onSubmit }: Props) => {
  const [text, setText] = useState("")

  if (!onSubmit) {
    return (
      <p className="mx-auto mb-8 rounded-full bg-black/40 px-6 py-3 text-center text-2xl font-bold text-white">
        Type your answer on your device
      </p>
    )
  }

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault()

    if (text.trim()) {
      onSubmit(text.trim())
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mx-auto mb-4 flex w-full max-w-xl flex-col gap-2 px-4"
    >
      <Input
        autoFocus
        value={text}
        maxLength={MAX_LENGTH}
        onChange={(e) => setText(e.target.value)}
        placeholder="Your answer"
        className="w-full bg-white text-center text-2xl"
      />
      <Button type="submit" disabled={!text.trim()}>
        Submit
      </Button>
    </form>
  )
}

export default TypedAnswer
