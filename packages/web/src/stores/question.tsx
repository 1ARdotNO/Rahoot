import { GameUpdateQuestion } from "@rahoot/common/types/game"
import { create } from "zustand"

type QuestionStore = {
  questionStates: GameUpdateQuestion | null
  paused: boolean
  setQuestionStates: (_state: GameUpdateQuestion | null) => void
  setPaused: (_paused: boolean) => void
}

export const useQuestionStore = create<QuestionStore>((set) => ({
  questionStates: null,
  paused: false,
  setQuestionStates: (state) => set({ questionStates: state }),
  setPaused: (paused) => set({ paused }),
}))
