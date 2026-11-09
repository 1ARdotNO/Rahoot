import { RefObject, useLayoutEffect } from "react"

type Options = {
  minPx: number
  maxPx: () => number
}

const SEARCH_STEPS = 10

// Largest font size (between min and max) at which the element's content fits its box;
// children sized in em scale along with it.
const useFitText = (
  ref: RefObject<HTMLElement | null>,
  { minPx, maxPx }: Options,
  deps: unknown[],
) => {
  useLayoutEffect(() => {
    const el = ref.current

    if (!el) {
      return undefined
    }

    const fits = () => el.scrollHeight <= el.clientHeight + 1

    const fit = () => {
      let low = minPx
      let high = Math.max(minPx, maxPx())

      el.style.overflowY = "hidden"
      el.style.fontSize = `${high}px`

      if (!fits()) {
        for (let i = 0; i < SEARCH_STEPS; i += 1) {
          const mid = (low + high) / 2
          el.style.fontSize = `${mid}px`

          if (fits()) {
            low = mid
          } else {
            high = mid
          }
        }

        el.style.fontSize = `${low}px`
      }

      // Only a slide too long to fit even at the minimum size may scroll.
      el.style.overflowY = fits() ? "hidden" : "auto"
    }

    fit()

    // The box itself resizes as the text shrinks, so watch the parent instead.
    const observer = new ResizeObserver(() => fit())

    if (el.parentElement) {
      observer.observe(el.parentElement)
    }

    // Images inside the Markdown change the height once they load.
    el.addEventListener("load", fit, true)

    return () => {
      observer.disconnect()
      el.removeEventListener("load", fit, true)
    }
  }, deps)
}

export default useFitText
