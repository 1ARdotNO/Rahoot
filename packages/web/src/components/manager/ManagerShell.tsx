import logo from "@rahoot/web/assets/logo.svg"
import clsx from "clsx"
import Image from "next/image"
import { PropsWithChildren } from "react"

export type ManagerTab = "quizzes" | "results" | "apiKeys"

type Props = PropsWithChildren<{
  tab: ManagerTab | null
  onTab: (_tab: ManagerTab) => void
  userName: string | null
  canManageApiKeys: boolean
  onLogout: () => void
}>

const TABS: { id: ManagerTab; label: string; icon: string }[] = [
  { id: "quizzes", label: "Quizzes", icon: "🧩" },
  { id: "results", label: "Results", icon: "📊" },
  { id: "apiKeys", label: "API keys", icon: "🔑" },
]

const ManagerShell = ({
  tab,
  onTab,
  userName,
  canManageApiKeys,
  onLogout,
  children,
}: Props) => {
  const tabs = TABS.filter((t) => t.id !== "apiKeys" || canManageApiKeys)

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="bg-secondary/85 sticky top-0 z-30 border-b border-white/10 backdrop-blur">
        <div className="mx-auto flex max-w-[1600px] items-center gap-3 px-4 py-3 md:gap-6 md:px-8">
          <Image
            src={logo}
            alt="Rahoot!"
            className="h-6 w-auto shrink-0 sm:h-8 md:h-9"
            priority
          />

          <nav className="flex min-w-0 flex-1 gap-1 overflow-x-auto">
            {tabs.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => onTab(t.id)}
                aria-current={tab === t.id ? "page" : undefined}
                className={clsx(
                  "flex shrink-0 items-center gap-2 rounded-full px-3 py-2 text-sm font-bold transition sm:px-4",
                  tab === t.id
                    ? "bg-primary shadow-inset text-white"
                    : "text-white/70 hover:bg-white/10 hover:text-white",
                )}
              >
                <span aria-hidden>{t.icon}</span>
                <span className="hidden sm:inline">{t.label}</span>
              </button>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            {userName && (
              <div className="hidden items-center gap-2 md:flex">
                <span className="bg-primary/20 text-primary flex h-8 w-8 items-center justify-center rounded-full text-sm font-extrabold">
                  {userName.slice(0, 1).toUpperCase()}
                </span>
                <span className="max-w-48 truncate text-sm font-semibold text-white/80">
                  {userName}
                </span>
              </div>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="rounded-full border border-white/20 px-3 py-1.5 text-xs font-semibold text-white/80 transition hover:bg-white/10 hover:text-white sm:text-sm"
            >
              Log out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-[1600px] flex-1 px-4 py-6 md:px-8 md:py-10">
        {children}
      </main>
    </div>
  )
}

export default ManagerShell
