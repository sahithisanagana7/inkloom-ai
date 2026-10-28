"use client"

import { forwardRef, useImperativeHandle, useRef, type ReactNode } from "react"
import type { Issue } from "@/lib/types"
import { cn } from "@/lib/utils"

export type HighlightedEditorHandle = { select: (start: number, end: number) => void }

const SHARED =
  "col-start-1 row-start-1 min-h-72 w-full whitespace-pre-wrap break-words px-4 py-3 font-sans text-[15px] leading-7"

/**
 * A textarea layered over a mirror div. The mirror renders <mark> highlights for each
 * text issue; the transparent textarea on top handles editing and caret hit-testing.
 */
export const HighlightedEditor = forwardRef<
  HighlightedEditorHandle,
  {
    value: string
    onChange: (v: string) => void
    issues: Issue[]
    activeIssueId: string | null
    onIssueClick: (id: string) => void
    disabled?: boolean
  }
>(function HighlightedEditor({ value, onChange, issues, activeIssueId, onIssueClick, disabled }, ref) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const mirrorRef = useRef<HTMLDivElement>(null)

  useImperativeHandle(ref, () => ({
    select: (start, end) => {
      const ta = textareaRef.current
      if (!ta) return
      ta.focus({ preventScroll: true })
      ta.setSelectionRange(start, end)
      ta.closest("[data-editor]")?.scrollIntoView({ block: "nearest", behavior: "smooth" })
    },
  }))

  const textIssues = issues.filter((i) => i.start !== undefined && i.end !== undefined)

  const nodes: ReactNode[] = []
  let cursor = 0
  for (const issue of textIssues) {
    if (issue.start! < cursor) continue
    if (issue.start! > cursor) nodes.push(value.slice(cursor, issue.start))
    const active = issue.id === activeIssueId
    nodes.push(
      <mark
        key={issue.id}
        className={cn(
          "rounded-sm text-transparent underline decoration-2 underline-offset-4 transition-colors",
          issue.severity === "high"
            ? "bg-red-500/15 decoration-red-500"
            : "bg-amber-400/20 decoration-amber-500",
          active && (issue.severity === "high" ? "bg-red-500/35" : "bg-amber-400/45"),
        )}
      >
        {value.slice(issue.start, issue.end)}
      </mark>,
    )
    cursor = issue.end!
  }
  nodes.push(value.slice(cursor))
  nodes.push("\n")

  const handleCaret = () => {
    const ta = textareaRef.current
    if (!ta) return
    const pos = ta.selectionStart
    const hit = textIssues.find((i) => pos >= i.start! && pos <= i.end!)
    if (hit) onIssueClick(hit.id)
  }

  return (
    <div data-editor className="grid rounded-lg border bg-background focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/20">
      <div ref={mirrorRef} aria-hidden className={cn(SHARED, "pointer-events-none overflow-hidden text-transparent")}>
        {nodes}
      </div>
      <label htmlFor="draft-body" className="sr-only">
        Draft body
      </label>
      <textarea
        id="draft-body"
        ref={textareaRef}
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        onClick={handleCaret}
        onKeyUp={(e) => e.key.startsWith("Arrow") && handleCaret()}
        onScroll={(e) => {
          if (mirrorRef.current) mirrorRef.current.scrollTop = e.currentTarget.scrollTop
        }}
        spellCheck={false}
        placeholder="Start writing your draft…"
        className={cn(
          SHARED,
          "field-sizing-content resize-none bg-transparent text-foreground caret-primary outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-70",
        )}
      />
    </div>
  )
})
