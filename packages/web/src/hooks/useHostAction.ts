import { ActionResult } from "@rahoot/common/types/game"
import { useSocket } from "@rahoot/web/contexts/socketProvider"
import { useManagerStore } from "@rahoot/web/stores/manager"
import toast from "react-hot-toast"

export type HostEvent =
  | "manager:startGame"
  | "manager:abortQuiz"
  | "manager:nextQuestion"
  | "manager:showLeaderboard"
  | "manager:togglePause"
  | "manager:skipQuestion"

const ACK_TIMEOUT_MS = 5000

// Sends a host action and always resolves, so buttons can never stay locked on a lost click.
const useHostAction = () => {
  const { socket } = useSocket()
  const { gameId, step, setStatus, setStep } = useManagerStore()

  return (event: HostEvent) =>
    new Promise<ActionResult>((resolve) => {
      // Queued emits would replay on reconnect before the page re-identifies as host.
      if (!socket?.connected || !gameId) {
        toast.error("Reconnecting… try again in a moment")
        resolve({ ok: false, error: "offline" })

        return
      }

      socket
        .timeout(ACK_TIMEOUT_MS)
        .emit(event, { gameId, step }, (error: Error, result: ActionResult) => {
          if (error) {
            toast.error("No reply from the server yet. If nothing happens, click again.")
            resolve({ ok: false, error: "timeout" })

            return
          }

          if (!result.ok && result.current) {
            setStatus(result.current.name, result.current.data)
            setStep(result.current.step)
          } else if (!result.ok && !result.stale) {
            toast.error(result.error)
          }

          resolve(result)
        })
    })
}

export default useHostAction
