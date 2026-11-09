"use client"

import { CommonStatusDataMap } from "@rahoot/common/types/game/status"
import Markdown from "@rahoot/web/components/Markdown"
import FillMedia from "@rahoot/web/components/game/FillMedia"
import clsx from "clsx"

type Props = {
  data: CommonStatusDataMap["SHOW_SLIDE"]
}

// Slides are read off a projector or TV, so type scales with the viewport rather than
// stopping at a desktop size; clamp keeps phones readable and 4K screens sane.
const Slide = ({ data: { title, content, image } }: Props) => (
  <section className="anim-show relative mx-auto flex w-full max-w-[min(92vw,160rem)] flex-1 flex-col items-center justify-center gap-[clamp(1rem,2.5vh,2.5rem)] px-4 pb-8">
    {title && (
      <h2 className="shrink-0 text-center text-[clamp(2rem,4.5vw,9rem)] leading-tight font-bold text-white drop-shadow-lg">
        {title}
      </h2>
    )}

    {image && <FillMedia src={image} alt={title ?? "Slide image"} />}

    {content.trim() && (
      <Markdown
        className={clsx(
          image ? "max-h-[45vh]" : "max-h-[65vh]",
          "w-full shrink-0 overflow-y-auto rounded-xl bg-white p-[clamp(1.25rem,3vw,4rem)] text-[clamp(1.25rem,2.4vw,5rem)] text-gray-800 shadow-lg",
        )}
      >
        {content}
      </Markdown>
    )}
  </section>
)

export default Slide
