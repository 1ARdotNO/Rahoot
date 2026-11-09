import {
  ACCEPTED_IMAGE_TYPES,
  ImageUpload,
  MAX_IMAGE_BYTES,
} from "@rahoot/web/components/game/create/editor/draft"
import { DragEvent } from "react"
import toast from "react-hot-toast"

type Props = {
  image?: string
  onChange: (
    _image: string | undefined,
    _upload: ImageUpload | undefined,
  ) => void
}

const ImageField = ({ image, onChange }: Props) => {
  const readFile = (file: File | undefined) => {
    if (!file) {
      return
    }

    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast.error("Only PNG, JPEG, GIF or WebP images are supported")

      return
    }

    if (file.size > MAX_IMAGE_BYTES) {
      toast.error("Image must be under 5MB")

      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = reader.result as string
      const [, data] = dataUrl.split(",")
      onChange(dataUrl, { data })
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    readFile(e.dataTransfer.files[0])
  }

  const handleBrowse = () => {
    const input = document.createElement("input")
    input.type = "file"
    input.accept = ACCEPTED_IMAGE_TYPES.join(",")
    input.onchange = () => readFile(input.files?.[0])
    input.click()
  }

  return (
    <div>
      <label className="mb-1 block text-sm font-semibold text-gray-600">
        Image (optional)
      </label>
      {image ? (
        <div className="relative">
          <img
            src={image}
            alt="Preview"
            className="max-h-48 w-full rounded-md border border-gray-200 object-contain"
          />
          <button
            type="button"
            onClick={() => onChange(undefined, undefined)}
            className="absolute top-2 right-2 rounded-full bg-red-500 px-2 py-0.5 text-sm font-bold text-white hover:bg-red-600"
          >
            X
          </button>
        </div>
      ) : (
        <div
          role="button"
          tabIndex={0}
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault()
            e.stopPropagation()
          }}
          onClick={handleBrowse}
          onKeyDown={(e) => e.key === "Enter" && handleBrowse()}
          className="flex cursor-pointer flex-col items-center justify-center rounded-md border-2 border-dashed border-gray-300 p-6 text-gray-400 transition hover:border-gray-400 hover:text-gray-500"
        >
          <span className="text-3xl">📁</span>
          <span className="mt-1 text-sm">
            Drag & drop an image here, or click to browse
          </span>
        </div>
      )}
    </div>
  )
}

export default ImageField
