import clsx from "clsx"
import ReactMarkdown, { Components } from "react-markdown"
import remarkGfm from "remark-gfm"

type Props = {
  children: string
  className?: string
}

const components: Components = {
  h1: ({ children }) => <h1 className="mb-3 text-3xl font-bold">{children}</h1>,
  h2: ({ children }) => <h2 className="mb-3 text-2xl font-bold">{children}</h2>,
  h3: ({ children }) => <h3 className="mb-2 text-xl font-bold">{children}</h3>,
  p: ({ children }) => <p className="mb-3 last:mb-0">{children}</p>,
  ul: ({ children }) => <ul className="mb-3 list-disc pl-6">{children}</ul>,
  ol: ({ children }) => <ol className="mb-3 list-decimal pl-6">{children}</ol>,
  li: ({ children }) => <li className="mb-1">{children}</li>,
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
    <blockquote className="mb-3 border-l-4 border-gray-300 pl-4 italic">
      {children}
    </blockquote>
  ),
  code: ({ children }) => (
    <code className="rounded bg-gray-100 px-1 font-mono text-[0.9em]">
      {children}
    </code>
  ),
  pre: ({ children }) => (
    <pre className="mb-3 overflow-x-auto rounded bg-gray-100 p-3">
      {children}
    </pre>
  ),
  img: ({ src, alt }) => (
    <img src={src} alt={alt ?? ""} className="mx-auto my-3 max-h-80 rounded" />
  ),
  table: ({ children }) => (
    <table className="mb-3 w-full border-collapse text-left">{children}</table>
  ),
  th: ({ children }) => (
    <th className="border-b-2 border-gray-300 px-2 py-1">{children}</th>
  ),
  td: ({ children }) => (
    <td className="border-b border-gray-200 px-2 py-1">{children}</td>
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
