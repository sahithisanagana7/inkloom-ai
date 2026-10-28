"use client"

import { ArrowRight, PenLine, ShieldCheck, UserCog } from "lucide-react"
import { useAuth } from "./app-provider"
import { Logo } from "./logo"
import { ThemeToggle } from "./shell/theme-toggle"
import type { Role } from "@/lib/types"

const ROLES: { role: Role; label: string; description: string; icon: typeof PenLine; perms: string[] }[] = [
  {
    role: "creator",
    label: "Sign in as Creator",
    description: "Draft content and run the AI compliance inspector.",
    icon: PenLine,
    perms: ["Draft & inspect", "Submit for review", "Read-only Brand Hub"],
  },
  {
    role: "manager",
    label: "Sign in as Manager",
    description: "Govern brand guidelines and approve submissions.",
    icon: UserCog,
    perms: ["Approve & request changes", "Edit Brand Hub", "Ingest documents"],
  },
  {
    role: "admin",
    label: "Sign in as Admin",
    description: "Full control including API keys and privacy settings.",
    icon: ShieldCheck,
    perms: ["All manager permissions", "Issue & revoke API keys", "Data privacy controls"],
  },
]

export function LoginScreen() {
  const { signIn } = useAuth()
  return (
    <div className="relative flex min-h-dvh flex-col overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 [background-image:linear-gradient(to_right,var(--border)_1px,transparent_1px),linear-gradient(to_bottom,var(--border)_1px,transparent_1px)] [background-size:48px_48px] [mask-image:radial-gradient(ellipse_at_top,black_20%,transparent_70%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      />
      <header className="relative flex items-center justify-between px-6 py-4">
        <Logo />
        <ThemeToggle />
      </header>
      <main className="relative flex flex-1 items-center justify-center px-4 pb-16">
        <div className="flex w-full max-w-3xl flex-col items-center gap-10">
          <div className="flex flex-col items-center gap-4 text-center">
            <span className="inline-flex items-center gap-2 rounded-full border bg-card/60 px-3 py-1 text-xs text-muted-foreground backdrop-blur">
              <span className="size-1.5 rounded-full bg-emerald-500" aria-hidden />
              Enterprise Brand Governance
            </span>
            <h1 className="text-4xl font-semibold tracking-tight text-balance md:text-5xl">
              Every word, every pixel, on brand.
            </h1>
            <p className="max-w-lg text-muted-foreground text-pretty">
              Inkloom inspects drafts against your living brand guidelines in real time, then routes them through a
              governed approval pipeline.
            </p>
          </div>
          <div className="grid w-full gap-3 md:grid-cols-3">
            {ROLES.map(({ role, label, description, icon: Icon, perms }) => (
              <button
                key={role}
                type="button"
                onClick={() => signIn(role)}
                className="group flex flex-col gap-4 rounded-xl border bg-card/70 p-5 text-left shadow-xs backdrop-blur-xl transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 focus-visible:ring-3 focus-visible:ring-ring/30 focus-visible:outline-none"
              >
                <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-inset ring-primary/20">
                  <Icon className="size-4" aria-hidden />
                </span>
                <div className="flex flex-col gap-1">
                  <span className="flex items-center justify-between text-sm font-semibold">
                    {label}
                    <ArrowRight
                      className="size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary"
                      aria-hidden
                    />
                  </span>
                  <span className="text-xs text-muted-foreground">{description}</span>
                </div>
                <ul className="flex flex-col gap-1.5 border-t pt-3">
                  {perms.map((p) => (
                    <li key={p} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="size-1 rounded-full bg-primary/60" aria-hidden />
                      {p}
                    </li>
                  ))}
                </ul>
              </button>
            ))}
          </div>
          <p className="text-xs text-muted-foreground">
            Demo environment — role permissions are enforced throughout the session.
          </p>
        </div>
      </main>
    </div>
  )
}
