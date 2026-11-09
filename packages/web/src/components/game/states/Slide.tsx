"use client"

import { CommonStatusDataMap } from "@rahoot/common/types/game/status"
import Markdown from "@rahoot/web/components/Markdown"
import FillMedia from "@rahoot/web/components/game/FillMedia"
import useFitText from "@rahoot/web/hooks/useFitText"
import { useRef } from "react"

type Props = {
  data: CommonStatusDataMap["SHOW_SLIDE"]
}

const MIN_TEXT_PX = 16
const MAX_TEXT_PX = 80

// Slides are read off a projector or TV: text starts large (scaled to the screen width)
// and shrinks until the whole slide fits on screen, so nobody has to scroll.
const Slide = ({ data: { title, content, image } }: Props) => {
  const textRef = useRef<HTMLDivElement>(null)

  useFitText(
    textRef,
    {
      minPx: MIN_TEXT_PX,
      maxPx: () =>
        Math.min(MAX_TEXT_PX, Math.max(20, window.innerWidth * 0.024)),
    },
    [content, title, image],
  )

  return (
    <section className="anim-show relative mx-auto flex min-h-0 w-full max-w-[min(92vw,160rem)] flex-1 flex-col items-center justify-center gap-[clamp(1rem,2.5vh,2.5rem)] px-4 pb-8">
      {title && (
        <h2 className="shrink-0 text-center text-[clamp(2rem,4.5vw,9rem)] leading-tight font-bold text-white drop-shadow-lg">
          {title}
        </h2>
      )}

      {image && (
        <FillMedia
          src={image}
          alt={title ?? "Slide image"}
          minHeight={content.trim() ? "min-h-[20vh]" : "min-h-[30vh]"}
        />
      )}

      {content.trim() && (
        <div
          ref={textRef}
          className="min-h-0 w-full shrink rounded-xl bg-white p-[clamp(1.25rem,3vw,4rem)] text-gray-800 shadow-lg"
        >
          <Markdown>{content}</Markdown>
        </div>
      )}
    </section>
  )
}

export default Slide
