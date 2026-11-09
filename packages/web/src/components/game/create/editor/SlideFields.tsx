import { QuizzSlide } from "@rahoot/common/types/game"
import Input from "@rahoot/web/components/Input"
import Markdown from "@rahoot/web/components/Markdown"
import clsx from "clsx"
import { useState } from "react"

type Props = {
  slide: QuizzSlide
  onChange: (_update: Partial<QuizzSlide>) => void
}

const SlideFields = ({ slide, onChange }: Props) => {
  const [preview, setPreview] = useState(false)

  return (
    <>
      <div>
        <label className="mb-1 block text-sm font-semibold text-gray-600">
          Title (optional)
        </label>
        <Input
          value={slide.title ?? ""}
          onChange={(e) => onChange({ title: e.target.value })}
          placeholder="Slide title"
          className="w-full"
        />
      </div>

      <div>
        <div className="mb-1 flex items-center justify-between">
          <label className="text-sm font-semibold text-gray-600">
            Content (Markdown)
          </label>
          {/* Wide screens show a live preview beside the editor instead of tabs. */}
          <div className="flex overflow-hidden rounded border border-gray-300 text-xs font-semibold xl:hidden">
            {["Write", "Preview"].map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setPreview(tab === "Preview")}
                className={clsx(
                  "px-2 py-1",
                  (tab === "Preview") === preview
                    ? "bg-gray-200 text-gray-800"
                    : "text-gray-500",
                )}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <Markdown
          className={clsx(
            "min-h-40 rounded-sm border border-gray-200 p-3 text-gray-800 xl:hidden",
            !preview && "hidden",
          )}
        >
          {slide.content || "_Nothing to preview_"}
        </Markdown>
        {
          <textarea
            value={slide.content}
            onChange={(e) => onChange({ content: e.target.value })}
            rows={14}
            placeholder={
              "## Did you know?\n\nUse **bold**, _italics_, lists:\n\n- one\n- two\n\n[links](https://example.com) and ![images](https://...)"
            }
            className={clsx(
              "w-full rounded-sm p-2 font-mono text-sm outline-2 outline-gray-300 xl:block",
              preview && "hidden",
            )}
          />
        }
      </div>
    </>
  )
}

export default SlideFields
