import { ActionResult } from "@rahoot/common/types/game"

export const OK: ActionResult = { ok: true }

// `stale` tells the host UI the screen moved on, so it can quietly wait for the new one.
export const fail = (error: string, stale = false): ActionResult => ({
  ok: false,
  error,
  stale,
})
