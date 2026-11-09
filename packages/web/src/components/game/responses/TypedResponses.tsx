import { ManagerStatusDataMap } from "@rahoot/common/types/game/status"
import clsx from "clsx"

type Props = {
  typed: NonNullable<ManagerStatusDataMap["SHOW_RESPONSES"]["typed"]>
}

const TypedResponses = ({ typed: { accepted, submissions } }: Props) => (
  <div className="mx-auto mb-6 flex w-full max-w-3xl flex-col gap-4 px-4">
    <div className="rounded-md bg-green-500 p-4 text-center text-2xl font-bold text-white shadow-lg">
      {accepted.join(" / ")}
    </div>

    {submissions.length === 0 ? (
      <p className="text-center text-xl font-bold text-white">No answers</p>
    ) : (
      <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
        {submissions.map(({ text, count, correct }) => (
          <li
            key={text}
            className={clsx(
              "flex items-center justify-between rounded-md px-4 py-2 text-lg font-bold text-white",
              correct ? "bg-green-600" : "bg-black/50",
            )}
          >
            <span className="truncate">{text}</span>
            <span className="ml-3 rounded bg-black/20 px-2">{count}</span>
          </li>
        ))}
      </ul>
    )}
  </div>
)

export default TypedResponses
