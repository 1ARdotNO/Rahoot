import clsx from "clsx"

type Props = {
  src: string
  alt: string
  kind?: "image" | "video"
  className?: string
  // Smallest share of the screen the media keeps when other content needs room.
  minHeight?: string
}

// Fills whatever height is left in a flex column and scales to fit without cropping;
// absolute positioning keeps the media's own size from stretching the page.
const FillMedia = ({
  src,
  alt,
  kind = "image",
  className,
  minHeight = "min-h-[30vh]",
}: Props) => (
  <div className={clsx("relative w-full flex-1", minHeight, className)}>
    {kind === "video" ? (
      <video
        src={src}
        autoPlay
        controls
        className="absolute inset-0 h-full w-full object-contain"
      />
    ) : (
      <img
        src={src}
        alt={alt}
        className="absolute inset-0 h-full w-full object-contain drop-shadow-lg"
      />
    )}
  </div>
)

export default FillMedia
