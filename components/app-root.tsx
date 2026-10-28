"use client"

import { useApp } from "./app-provider"
import { AnalyticsView } from "./analytics/analytics-view"
import { ApprovalsView } from "./approvals/approvals-view"
import { BrandHubView } from "./brand-hub/brand-hub-view"
import { LoginScreen } from "./login-screen"
import { SettingsView } from "./settings/settings-view"
import { AppHeader } from "./shell/app-header"
import { AppSidebar } from "./shell/app-sidebar"
import { WorkspaceView } from "./workspace/workspace-view"

export function AppRoot() {
  const { user, view, tenant } = useApp()
  if (!user) return <LoginScreen />

  return (
    <div className="min-h-dvh">
      <AppHeader />
      <div className="flex flex-col md:flex-row">
        <AppSidebar />
        <main key={`${tenant.id}-${view}`} className="min-w-0 flex-1 p-4 animate-in fade-in md:p-8">
          <div className="mx-auto flex max-w-7xl flex-col gap-6">
            {view === "brand-hub" && <BrandHubView />}
            {view === "workspace" && <WorkspaceView />}
            {view === "approvals" && <ApprovalsView />}
            {view === "analytics" && <AnalyticsView />}
            {view === "settings" && <SettingsView />}
          </div>
        </main>
      </div>
    </div>
  )
}
