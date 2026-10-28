"use client"

import { BarChart3, BookOpen, GitPullRequestArrow, PenSquare, Settings } from "lucide-react"
import { useApp, type View } from "../app-provider"
import { cn } from "@/lib/utils"

const NAV: { id: View; label: string; icon: typeof BookOpen }[] = [
  { id: "workspace", label: "Content Workspace", icon: PenSquare },
  { id: "brand-hub", label: "Brand Hub", icon: BookOpen },
  { id: "approvals", label: "Approvals", icon: GitPullRequestArrow },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
  { id: "settings", label: "Settings & Audit", icon: Settings },
]

export function AppSidebar() {
  const { view, setView, posts } = useApp()
  const pending = posts.filter((p) => p.status === "pending").length

  return (
    <nav
      aria-label="Primary"
      className="sticky top-14 z-30 flex shrink-0 gap-1 overflow-x-auto border-b bg-sidebar/80 p-2 backdrop-blur md:h-[calc(100dvh-3.5rem)] md:w-60 md:flex-col md:border-r md:border-b-0 md:p-3"
    >
      <p className="hidden px-2 pb-1 text-xs font-medium text-muted-foreground md:block">Workspace</p>
      {NAV.map(({ id, label, icon: Icon }) => {
        const active = view === id
        return (
          <button
            key={id}
            type="button"
            onClick={() => setView(id)}
            aria-current={active ? "page" : undefined}
            className={cn(
              "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm whitespace-nowrap transition-colors",
              active
                ? "bg-card font-medium text-foreground shadow-xs ring-1 ring-border"
                : "text-muted-foreground hover:bg-sidebar-accent hover:text-foreground",
            )}
          >
            <Icon className={cn("size-4", active && "text-primary")} aria-hidden />
            {label}
            {id === "approvals" && pending > 0 ? (
              <span className="ml-auto rounded-full bg-primary/10 px-1.5 text-xs font-medium text-primary">
                {pending}
              </span>
            ) : null}
          </button>
        )
      })}
    </nav>
  )
}
