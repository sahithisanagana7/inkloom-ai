"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react"
import { DEMO_USERS, SEED_GUIDELINES, SEED_KEYS, SEED_LOGS, SEED_POSTS, TENANTS } from "@/lib/seed"
import type { ApiKey, AuditLog, Guideline, Post, Role, Tenant, TenantId, User } from "@/lib/types"

export type View = "brand-hub" | "workspace" | "approvals" | "analytics" | "settings"

type AppState = {
  user: User | null
  signIn: (role: Role) => void
  signOut: () => void
  tenant: Tenant
  setTenantId: (id: TenantId) => void
  view: View
  setView: (v: View) => void
  guidelines: Guideline[]
  addGuidelines: (g: Guideline[]) => void
  updateGuideline: (g: Guideline) => void
  deleteGuideline: (id: string) => void
  posts: Post[]
  upsertPost: (p: Post) => void
  activePostId: string | null
  openPostInWorkspace: (id: string | null) => void
  keys: ApiKey[]
  issueKey: (label: string) => ApiKey
  revokeKey: (id: string) => void
  logs: AuditLog[]
  logEvent: (feature: string, model?: string) => void
  discloseAi: boolean
  setDiscloseAi: (v: boolean) => void
}

const AppContext = createContext<AppState | null>(null)

const SESSION_KEY = "inkloom.session.role"

export function AppProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [tenantId, setTenantId] = useState<TenantId>("alpha")
  const [view, setView] = useState<View>("workspace")
  const [guidelineMap, setGuidelineMap] = useState(SEED_GUIDELINES)
  const [postMap, setPostMap] = useState(SEED_POSTS)
  const [activePostId, setActivePostId] = useState<string | null>(null)
  const [keys, setKeys] = useState<ApiKey[]>(SEED_KEYS)
  const [logs, setLogs] = useState<AuditLog[]>(SEED_LOGS)
  const [discloseAi, setDiscloseAi] = useState(true)
  const keysRef = useRef(keys)
  useEffect(() => {
    keysRef.current = keys
  }, [keys])

  const tenant = TENANTS.find((t) => t.id === tenantId)!

  useEffect(() => {
    const stored = sessionStorage.getItem(SESSION_KEY) as Role | null
    if (stored && DEMO_USERS[stored]) setUser(DEMO_USERS[stored])
  }, [])

  const signIn = useCallback((role: Role) => {
    sessionStorage.setItem(SESSION_KEY, role)
    setUser(DEMO_USERS[role])
    setView(role === "creator" ? "workspace" : "approvals")
    setActivePostId(null)
  }, [])

  const signOut = useCallback(() => {
    sessionStorage.removeItem(SESSION_KEY)
    setUser(null)
  }, [])

  const logEvent = useCallback(
    (feature: string, model = "gemini-2.5-flash") => {
      setLogs((prev) =>
        [
          {
            id: `l-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            timestamp: new Date().toISOString(),
            tenant: tenant.name,
            keyId: "session_ui",
            feature,
            model,
            status: "Success" as const,
          },
          ...prev,
        ].slice(0, 60),
      )
    },
    [tenant.name],
  )

  // Simulated external API traffic so the audit log feels live.
  useEffect(() => {
    if (!user) return
    const features = ["Compliance Scan", "Tone Rewrite", "Visual Palette Check", "Claim Verification"]
    const models = ["gemini-2.5-flash", "gemini-2.5-pro"]
    const interval = setInterval(() => {
      const currentKeys = keysRef.current
      const key = currentKeys[Math.floor(Math.random() * currentKeys.length)]
      if (!key) return
      const entry: AuditLog = {
        id: `l-${Date.now()}`,
        timestamp: new Date().toISOString(),
        tenant: TENANTS.find((t) => t.id === key.tenant)!.name,
        keyId: key.prefix,
        feature: features[Math.floor(Math.random() * features.length)],
        model: models[Math.floor(Math.random() * models.length)],
        status: key.revoked ? "Denied" : "Success",
      }
      setLogs((prev) => [entry, ...prev].slice(0, 60))
    }, 9000)
    return () => clearInterval(interval)
  }, [user])

  const value = useMemo<AppState>(
    () => ({
      user,
      signIn,
      signOut,
      tenant,
      setTenantId: (id) => {
        setTenantId(id)
        setActivePostId(null)
      },
      view,
      setView,
      guidelines: guidelineMap[tenantId],
      addGuidelines: (g) => setGuidelineMap((m) => ({ ...m, [tenantId]: [...m[tenantId], ...g] })),
      updateGuideline: (g) =>
        setGuidelineMap((m) => ({ ...m, [tenantId]: m[tenantId].map((x) => (x.id === g.id ? g : x)) })),
      deleteGuideline: (id) =>
        setGuidelineMap((m) => ({ ...m, [tenantId]: m[tenantId].filter((x) => x.id !== id) })),
      posts: postMap[tenantId],
      upsertPost: (p) =>
        setPostMap((m) => {
          const list = m[tenantId]
          const exists = list.some((x) => x.id === p.id)
          return { ...m, [tenantId]: exists ? list.map((x) => (x.id === p.id ? p : x)) : [p, ...list] }
        }),
      activePostId,
      openPostInWorkspace: (id) => {
        setActivePostId(id)
        setView("workspace")
      },
      keys,
      issueKey: (label) => {
        const rand = Math.random().toString(16).slice(2, 6)
        const key: ApiKey = {
          id: `key_${rand}`,
          label,
          prefix: `ink_live_${rand}`,
          tenant: tenantId,
          createdAt: new Date().toISOString(),
          revoked: false,
        }
        setKeys((k) => [key, ...k])
        return key
      },
      revokeKey: (id) => setKeys((k) => k.map((x) => (x.id === id ? { ...x, revoked: true } : x))),
      logs,
      logEvent,
      discloseAi,
      setDiscloseAi,
    }),
    [user, signIn, signOut, tenant, view, guidelineMap, tenantId, postMap, activePostId, keys, logs, logEvent, discloseAi],
  )

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>
}

export function useApp() {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error("useApp must be used within AppProvider")
  return ctx
}

export function useAuth() {
  const { user, signIn, signOut } = useApp()
  const role = user?.role
  return {
    user,
    signIn,
    signOut,
    canManage: role === "manager" || role === "admin",
    isAdmin: role === "admin",
  }
}
