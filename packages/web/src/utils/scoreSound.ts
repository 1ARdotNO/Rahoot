// Soft count-up sound for the leaderboard, synthesised so there's no audio asset to ship.
// Ticks follow the same ease-out curve as the numbers, rising through a pentatonic scale,
// and finish with a quiet two-note chime.

const PENTATONIC = [
  523.25, 587.33, 659.25, 783.99, 880.0, 1046.5, 1174.66, 1318.51,
]
const CHIME = [1046.5, 1567.98]
const TICKS = 12
// Kept well below the game's other effects (~-24 dBFS peak); this should sit underneath them.
const MASTER_VOLUME = 0.12

let context: AudioContext | null = null

const getContext = () => {
  if (typeof window === "undefined" || !("AudioContext" in window)) {
    return null
  }

  context ??= new AudioContext()

  if (context.state === "suspended") {
    context.resume().catch(() => undefined)
  }

  return context
}

const note = (
  ctx: BaseAudioContext,
  output: AudioNode,
  {
    frequency,
    start,
    length,
    level,
  }: { frequency: number; start: number; length: number; level: number },
) => {
  const osc = ctx.createOscillator()
  const gain = ctx.createGain()

  osc.type = "sine"
  osc.frequency.setValueAtTime(frequency, start)
  gain.gain.setValueAtTime(0.0001, start)
  gain.gain.exponentialRampToValueAtTime(level, start + 0.008)
  gain.gain.exponentialRampToValueAtTime(0.0001, start + length)

  osc.connect(gain).connect(output)
  osc.start(start)
  osc.stop(start + length + 0.05)
}

// Inverse of the ease-out cubic used for the numbers: when does the count reach `progress`?
const timeAt = (progress: number) => 1 - Math.cbrt(1 - progress)

export const scheduleScoreCountUp = (
  ctx: BaseAudioContext,
  durationS: number,
  startAt = ctx.currentTime + 0.02,
) => {
  const master = ctx.createGain()
  master.gain.value = MASTER_VOLUME
  master.connect(ctx.destination)

  for (let i = 0; i < TICKS; i += 1) {
    const progress = i / TICKS
    const scaleIndex = Math.round(progress * (PENTATONIC.length - 1))

    note(ctx, master, {
      frequency: PENTATONIC[scaleIndex],
      start: startAt + timeAt(progress) * durationS,
      length: 0.09,
      level: 0.35 + progress * 0.25,
    })
  }

  CHIME.forEach((frequency, i) => {
    note(ctx, master, {
      frequency,
      start: startAt + durationS + i * 0.07,
      length: 0.7,
      level: 0.45,
    })
  })
}

export const playScoreCountUp = (durationS: number) => {
  const ctx = getContext()

  if (ctx) {
    scheduleScoreCountUp(ctx, durationS)
  }
}
