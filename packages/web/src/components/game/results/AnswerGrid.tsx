import { GameResult, ResultAnswer } from "@rahoot/common/types/game/results"
import clsx from "clsx"

const cell = (answer: ResultAnswer | undefined) => {
  if (!answer || answer.answer === null) {
    return { symbol: "–", style: "bg-gray-100 text-gray-400" }
  }

  return answer.correct
    ? { symbol: "✓", style: "bg-green-500 text-white" }
    : { symbol: "✗", style: "bg-red-400 text-white" }
}

type Props = {
  result: GameResult
}

// Players × questions overview; a quick way to spot hard questions and strong players.
const AnswerGrid = ({ result }: Props) => {
  const rounds = result.rounds.filter((r) => !r.skipped)

  return (
    <div className="overflow-x-auto">
      <table className="border-separate border-spacing-1 text-sm">
        <thead>
          <tr>
            <th className="sticky left-0 z-10 bg-white px-2 text-left font-semibold text-gray-500">
              Player
            </th>
            {rounds.map((round) => (
              <th
                key={round.questionNumber}
                title={round.question}
                className="w-11 px-1 text-center font-semibold text-gray-500"
              >
                Q{round.questionNumber}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {result.players.map((player) => (
            <tr key={`${player.rank}-${player.username}`}>
              <td className="sticky left-0 z-10 max-w-44 truncate bg-white px-2 font-semibold whitespace-nowrap">
                {player.username}
              </td>
              {rounds.map((round) => {
                const answer = round.answers.find(
                  (a) => a.username === player.username,
                )
                let label = "No answer"

                if (answer?.answer !== null && answer?.answer !== undefined) {
                  label = `${answer.answer} (+${answer.points})`
                }

                return (
                  <td
                    key={round.questionNumber}
                    title={`${player.username}, Q${round.questionNumber}: ${label}`}
                    className={clsx(
                      "h-8 w-11 rounded-md text-center text-xs font-bold",
                      cell(answer).style,
                    )}
                  >
                    {cell(answer).symbol}
                  </td>
                )
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default AnswerGrid
