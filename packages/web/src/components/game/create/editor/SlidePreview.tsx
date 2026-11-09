import { QuizzSlide } from "@rahoot/common/types/game"
import Markdown from "@rahoot/web/components/Markdown"

// Approximates the in-game slide so authors see roughly what players will see.
const SlidePreview = ({ slide }: { slide: QuizzSlide }) => (
  <div>
    <div className="mb-1 text-sm font-semibold text-gray-600">Preview</div>
    <div className="flex min-h-80 flex-col items-center justify-center gap-4 rounded-xl bg-orange-600/80 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.15),transparent_60%)] p-6">
      {slide.title && (
        <h2 className="text-center text-3xl font-bold text-white drop-shadow-lg">
          {slide.title}
        </h2>
      )}
      {slide.image && (
        <img src={slide.image} alt="" className="max-h-40 rounded-md" />
      )}
      {slide.content.trim() ? (
        <Markdown className="max-h-72 w-full overflow-y-auto rounded-md bg-white p-4 text-gray-800 shadow-lg">
          {slide.content}
        </Markdown>
      ) : (
        !slide.title && (
          <span className="text-white/70">Nothing to preview yet</span>
        )
      )}
    </div>
  </div>
)

export default SlidePreview
