type Options = {
  onTick: (_remaining: number) => void
  isPaused: () => boolean
}

// Resolves after `seconds`, or early via abort(); ticks are held while paused.
class Countdown {
  private timer: ReturnType<typeof setInterval> | null = null

  private resolve: (() => void) | null = null

  private readonly options: Options

  constructor(options: Options) {
    this.options = options
  }

  start(seconds: number): Promise<void> {
    this.abort()

    let count = seconds - 1

    return new Promise<void>((resolve) => {
      this.resolve = resolve
      this.timer = setInterval(() => {
        if (this.options.isPaused()) {
          return
        }

        if (count <= 0) {
          this.abort()

          return
        }

        this.options.onTick(count)
        count -= 1
      }, 1000)
    })
  }

  abort() {
    if (this.timer) {
      clearInterval(this.timer)
    }

    const { resolve } = this
    this.timer = null
    this.resolve = null
    resolve?.()
  }
}

export default Countdown
