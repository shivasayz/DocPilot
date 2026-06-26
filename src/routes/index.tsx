import { createFileRoute } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  Database,
  FileText,
  Boxes,
  MessagesSquare,
  Clock,
  Upload,
  FolderPlus,
  NotebookPen,
  Sparkles,
  ArrowUpRight,
  Search,
  TrendingUp,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Dashboard — Copilot" }],
  }),
  component: Dashboard,
});

const stats = [
  { label: "Knowledge Sources", value: "12", delta: "+2 this week", icon: Database },
  { label: "Indexed Documents", value: "284", delta: "+18 today", icon: FileText },
  { label: "Total Chunks", value: "12,847", delta: "98% embedded", icon: Boxes },
  { label: "Questions Asked", value: "1,204", delta: "+47 today", icon: MessagesSquare },
];

const recentDocs = [
  { name: "Designing Data-Intensive Applications.pdf", size: "8.2 MB", chunks: 412, when: "2h ago" },
  { name: "Rust Book — Ownership.md", size: "42 KB", chunks: 28, when: "5h ago" },
  { name: "Transformer Architecture (Vaswani 2017).pdf", size: "1.4 MB", chunks: 96, when: "Yesterday" },
  { name: "Personal — Weekly Review Template.md", size: "12 KB", chunks: 6, when: "2d ago" },
];

const activity = [
  { kind: "index", text: "Finished indexing notion-export-2026.zip", when: "3m" },
  { kind: "chat", text: "Asked about CAP theorem trade-offs", when: "27m" },
  { kind: "note", text: "Created note 'RAG retrieval tuning'", when: "1h" },
  { kind: "watch", text: "Watching folder ~/Documents/Papers", when: "3h" },
];

const searches = [
  "How does HNSW differ from IVF?",
  "Best chunk size for technical PDFs",
  "Summarize my notes on rust lifetimes",
  "Compare GPT-4o vs Gemini 1.5 Pro latency",
];

function Dashboard() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <PageHeader
        title="Good afternoon, Alex"
        description="Your learning copilot is ready. Here's what's happening across your workspace."
        actions={
          <>
            <Button variant="outline" size="sm">
              <Search className="size-4" /> Quick search
            </Button>
            <Button size="sm">
              <Sparkles className="size-4" /> Ask Copilot
            </Button>
          </>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04, duration: 0.3 }}
          >
            <Card className="group transition-colors hover:border-foreground/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <s.icon className="size-4 text-muted-foreground" />
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight">{s.value}</div>
                <div className="mt-1 flex items-center gap-1 text-xs text-success">
                  <TrendingUp className="size-3" />
                  {s.delta}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { icon: Upload, label: "Upload Document", hint: "PDF, MD, DOCX" },
          { icon: FolderPlus, label: "Add Folder", hint: "Watch local path" },
          { icon: NotebookPen, label: "Create Note", hint: "Markdown" },
          { icon: Sparkles, label: "Ask AI", hint: "Use your library" },
        ].map((a) => (
          <button
            key={a.label}
            className="group relative flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-all hover:-translate-y-0.5 hover:border-foreground/20"
          >
            <div className="grid size-9 place-items-center rounded-lg bg-muted text-foreground">
              <a.icon className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">{a.label}</div>
              <div className="truncate text-xs text-muted-foreground">{a.hint}</div>
            </div>
            <ArrowUpRight className="ml-auto size-4 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent documents</CardTitle>
            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">
              View all
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {recentDocs.map((d) => (
              <div
                key={d.name}
                className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-6 py-3.5 hover:bg-muted/40"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <div className="grid size-8 shrink-0 place-items-center rounded-md bg-muted">
                    <FileText className="size-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{d.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {d.size} · {d.chunks} chunks
                    </div>
                  </div>
                </div>
                <span className="shrink-0 text-xs text-muted-foreground">{d.when}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Today</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div>
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Learning time</span>
                <Clock className="size-3.5 text-muted-foreground" />
              </div>
              <div className="mt-1 text-2xl font-semibold tracking-tight">2h 14m</div>
              <div className="mt-3 grid grid-cols-12 gap-1">
                {Array.from({ length: 12 }).map((_, i) => {
                  const h = [10, 30, 60, 40, 80, 50, 70, 20, 90, 60, 35, 55][i];
                  return (
                    <div
                      key={i}
                      className="rounded-sm bg-accent/60"
                      style={{ height: `${h * 0.5 + 8}px` }}
                    />
                  );
                })}
              </div>
            </div>

            <div>
              <div className="mb-2 text-xs text-muted-foreground">Recent searches</div>
              <div className="space-y-1.5">
                {searches.map((s) => (
                  <div
                    key={s}
                    className="flex items-center gap-2 rounded-md px-2 py-1.5 text-xs hover:bg-muted/60"
                  >
                    <Search className="size-3 text-muted-foreground" />
                    <span className="truncate">{s}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Recent notes</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { t: "RAG retrieval tuning", tag: "AI" },
              { t: "Weekly review — week 26", tag: "Personal" },
              { t: "Postgres index strategy", tag: "DB" },
            ].map((n) => (
              <div
                key={n.t}
                className="flex items-center justify-between rounded-lg border border-border bg-surface/40 p-3 hover:border-foreground/20"
              >
                <div className="flex items-center gap-3">
                  <div className="size-1.5 rounded-full bg-accent" />
                  <span className="text-sm">{n.t}</span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {n.tag}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <ol className="relative space-y-4 pl-5">
              <span className="absolute left-[7px] top-2 bottom-2 w-px bg-border" />
              {activity.map((a) => (
                <li key={a.text} className="relative">
                  <span className="absolute -left-[18px] top-1.5 size-2 rounded-full bg-accent ring-4 ring-background" />
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{a.text}</span>
                    <span className="text-xs text-muted-foreground">{a.when}</span>
                  </div>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
