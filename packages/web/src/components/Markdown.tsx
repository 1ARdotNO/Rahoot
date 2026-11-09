import clsx from "clsx"
import ReactMarkdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"

type Props = {
  children: string
  className?: string
}

const components: Components = {
  h1: ({ children }) => (
    <h1 className="mb-[0.5em] text-[1.8em] leading-tight font-bold">
      {children}
    </h1>
  ),
  h2: ({ children }) => (
    <h2 className="mb-[0.5em] text-[1.5em] leading-tight font-bold">
      {children}
    </h2>
  ),
  h3: ({ children }) => (
    <h3 className="mb-[0.4em] text-[1.25em] leading-snug font-bold">
      {children}
    </h3>
  ),
  p: ({ children }) => <p className="mb-[0.75em] last:mb-0">{children}</p>,
  ul: ({ children }) => (
    <ul className="mb-[0.75em] list-disc pl-[1.5em]">{children}</ul>
  ),
  ol: ({ children }) => (
    <ol className="mb-[0.75em] list-decimal pl-[1.5em]">{children}</ol>
  ),
  li: ({ children }) => <li className="mb-[0.25em]">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-blue-600 underline"
    >
      {children}
    </a>
  ),
  blockquote: ({ children }) => (
    <blockquote className="mb-[0.75em] border-l-4 border-gray-300 pl-[1em] italic">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-gray-100 px-1 font-mono text-[0.9em]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-[0.75em] overflow-x-auto rounded bg-gray-100 p-[0.75em]">
      {children}
    </pre>
  ),
  img: ({ src, alt }) => (
    <img
      src={src}
      alt={alt ?? ""}
      className="mx-auto my-[0.75em] max-h-[12em] rounded"
    />
  ),
  table: ({ children }) => (
    <table className="mb-[0.75em] w-full border-collapse text-left">
      {children}
    </table>
  ),
  th: ({ children }) => (
    <th className="border-b-2 border-gray-300 px-[0.5em] py-[0.25em]">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border-b border-gray-200 px-[0.5em] py-[0.25em]">
      {children}
    </td>
  ),
}

// React-markdown escapes raw HTML and strips javascript: URLs by default.
const Markdown = ({ children, className }: Props) => (
  <div className={clsx("text-left leading-relaxed", className)}>
    <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
      {children}
    </ReactMarkdown>
  </div>
)

export default Markdown
