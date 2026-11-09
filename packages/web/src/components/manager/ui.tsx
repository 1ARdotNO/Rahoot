import clsx from "clsx"
import { ButtonHTMLAttributes, PropsWithChildren, ReactNode } from "react"

export const Card = ({
  children,
  className,
}: PropsWithChildren<{ className?: string }>) => (
  <div
    className={clsx(
      "rounded-2xl bg-white shadow-lg shadow-black/20",
      className,
    )}
  >
    {children}
  </div>
)

export const PageHeader = ({
  title,
  subtitle,
  actions,
}: {
  title: ReactNode
  subtitle?: ReactNode
  actions?: ReactNode
}) => (
  <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
    <div className="min-w-0">
      <h1 className="text-3xl font-extrabold tracking-tight text-white md:text-4xl">
        {title}
      </h1>
      {subtitle && <p className="mt-1 text-white/60">{subtitle}</p>}
    </div>
    {actions && (
      <div className="flex flex-wrap items-center gap-2">{actions}</div>
    )}
  </div>
)

type ToggleProps = {
  checked: boolean
  onChange: (_checked: boolean) => void
  label: string
  hint?: string
}

export const Toggle = ({ checked, onChange, label, hint }: ToggleProps) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    onClick={() => onChange(!checked)}
    className="flex w-full items-start gap-3 rounded-xl p-3 text-left transition hover:bg-gray-50"
  >
    <span
      className={clsx(
        "relative mt-0.5 inline-flex h-6 w-11 shrink-0 rounded-full transition",
        checked ? "bg-primary" : "bg-gray-300",
      )}
    >
      <span
        className={clsx(
          "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all",
          checked ? "left-5.5" : "left-0.5",
        )}
      />
    </span>
    <span className="min-w-0">
      <span className="block font-semibold text-gray-800">{label}</span>
      {hint && <span className="block text-sm text-gray-500">{hint}</span>}
    </span>
  </button>
)

export const Stat = ({
  label,
  value,
  accent = "text-gray-900",
}: {
  label: string
  value: ReactNode
  accent?: string
}) => (
  <Card className="p-4">
    <div className="text-xs font-semibold tracking-wide text-gray-500 uppercase">
      {label}
    </div>
    <div className={clsx("mt-1 truncate text-2xl font-extrabold", accent)}>
      {value}
    </div>
  </Card>
)

export const GhostButton = ({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) => (
  <button
    type="button"
    className={clsx(
      "rounded-lg px-3 py-2 text-sm font-semibold text-gray-600 transition hover:bg-gray-100 hover:text-gray-900 disabled:opacity-40",
      className,
    )}
    {...props}
  >
    {children}
  </button>
)

export const EmptyState = ({
  icon,
  title,
  children,
}: PropsWithChildren<{ icon: string; title: string }>) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/15 px-6 py-16 text-center text-white/70">
    <div className="mb-3 text-5xl">{icon}</div>
    <div className="text-xl font-bold text-white">{title}</div>
    <div className="mt-2 max-w-md">{children}</div>
  </div>
)
