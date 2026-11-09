"use client"

import { CommonStatusDataMap } from "@rahoot/common/types/game/status"
import Markdown from "@rahoot/web/components/Markdown"

type Props = {
  data: CommonStatusDataMap["SHOW_SLIDE"]
}

const Slide = ({ data: { title, content, image } }: Props) => (
  <section className="anim-show relative mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center gap-5 px-4 pb-8">
    {title && (
      <h2 className="text-center text-3xl font-bold text-white drop-shadow-lg md:text-5xl">
        {title}
      </h2>
    )}

    {image && (
      <img
        alt={title ?? "Slide image"}
        src={image}
        className="max-h-60 w-auto rounded-md sm:max-h-96"
      />
    )}

    {content.trim() && (
      <Markdown className="max-h-[50vh] w-full overflow-y-auto rounded-md bg-white p-6 text-lg text-gray-800 shadow-lg md:text-xl">
        {content}
      </Markdown>
    )}
  </section>
)

export default Slide
