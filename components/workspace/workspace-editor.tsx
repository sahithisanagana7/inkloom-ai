"use client"

import { FilePlus2, Send } from "lucide-react"
import { useMemo, useRef, useState } from "react"
import { toast } from "sonner"
import { useApp } from "../app-provider"
import { Badge, SectionHeader } from "../kit"
import { HighlightedEditor, type HighlightedEditorHandle } from "./highlighted-editor"
import { InspectorPanel } from "./inspector-panel"
import { MediaUploader } from "./media-uploader"
import { Button } from "@/components/ui/button"
import { analyzeDraft, applySuggestion } from "@/lib/compliance"
import type { Issue, MediaAsset, Post } from "@/lib/types"

const STATUS_LABEL = {
  draft: { label: "Draft", tone: "neutral" },
  pending: { label: "Pending Review", tone: "primary" },
  revision: { label: "Revision Requested", tone: "warning" },
  approved: { label: "Approved", tone: "success" },
} as const

export function WorkspaceEditor({ initial, isNew }: { initial: Post; isNew: boolean }) {
  const { guidelines, upsertPost, logEvent, openPostInWorkspace, setView, user } = useApp()
  const [title, setTitle] = useState(initial.title)
  const [body, setBody] = useState(initial.body)
  const [media, setMedia] = useState<MediaAsset[]>(initial.media)
  const [status, setStatus] = useState(initial.status)
  const [activeIssueId, setActiveIssueId] = useState<string | null>(null)
  const editorRef = useRef<HighlightedEditorHandle>(null)

  const { issues, score } = useMemo(() => analyzeDraft(body, media, guidelines), [body, media, guidelines])
  const locked = status === "pending" || status === "approved"

  const handleApply = (issue: Issue) => {
    if (issue.mediaId) return
    setBody((b) => applySuggestion(b, issue))
    setActiveIssueId(null)
    logEvent("Apply Suggestion")
    toast.success("Suggestion applied", { description: `${issue.category} issue resolved — score recalculated.` })
  }

  const handleSelectIssue = (issue: Issue) => {
    setActiveIssueId(issue.id)
    if (issue.start !== undefined && issue.end !== undefined) editorRef.current?.select(issue.start, issue.end)
  }

  const submit = () => {
    if (!title.trim() || !body.trim()) {
      toast.error("Add a title and body before submitting.")
      return
    }
    upsertPost({
      ...initial,
      title: title.trim(),
      body,
      media,
      status: "pending",
      score,
      author: initial.author || user?.name || "",
      updatedAt: new Date().toISOString(),
    })
    setStatus("pending")
    logEvent("Submit for Review")
    toast.success("Submitted for review", {
      description: "Forwarded to the approval pipeline. You'll be notified when a manager responds.",
      action: { label: "View", onClick: () => setView("approvals") },
    })
  }

  const statusMeta = STATUS_LABEL[status]

  return (
    <>
      <SectionHeader
        title="Content Workspace"
        description="Draft content and let the AI inspector check it against your Brand Hub in real time."
        actions={
          <>
            {!isNew ? (
              <Button variant="outline" onClick={() => openPostInWorkspace(null)}>
                <FilePlus2 data-icon="inline-start" />
                New draft
              </Button>
            ) : null}
            <Button onClick={submit} disabled={locked} className="hover:bg-primary/90">
              <Send data-icon="inline-start" />
              Submit for Review
            </Button>
          </>
        }
      />

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_400px]">
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-3 rounded-xl border bg-card p-4 shadow-xs">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="post-title" className="sr-only">
                Post title
              </label>
              <input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                disabled={locked}
                placeholder="Untitled draft"
                className="min-w-0 flex-1 bg-transparent text-lg font-semibold tracking-tight outline-none placeholder:text-muted-foreground disabled:opacity-70"
              />
              <Badge tone={statusMeta.tone}>{statusMeta.label}</Badge>
            </div>
            {locked ? (
              <p className="rounded-lg bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
                This post is {statusMeta.label.toLowerCase()} and locked for editing. Creators cannot publish or
                self-approve content.
              </p>
            ) : null}
            <HighlightedEditor
              ref={editorRef}
              value={body}
              onChange={setBody}
              issues={issues}
              activeIssueId={activeIssueId}
              onIssueClick={(id) => setActiveIssueId(id)}
              disabled={locked}
            />
          </div>
          <MediaUploader
            media={media}
            onChange={setMedia}
            issues={issues}
            disabled={locked}
            onIssueClick={(id) => setActiveIssueId(id)}
          />
        </div>

        <InspectorPanel
          score={score}
          issues={issues}
          activeIssueId={activeIssueId}
          onSelect={handleSelectIssue}
          onApply={handleApply}
          disabled={locked}
        />
      </div>
    </>
  )
}
