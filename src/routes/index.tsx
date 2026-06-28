import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Database,
  FileText,
  MessagesSquare,
  Clock,
  Upload,
  FolderPlus,
  NotebookPen,
  Sparkles,
  ArrowUpRight,
  Search,
  TrendingUp,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { AnimatedCounter } from "@/components/animated-counter";
import { UploadDialog } from "@/components/upload-dialog";
import { ComingSoonCard } from "@/components/coming-soon";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [{ title: "Dashboard — Copilot" }],
  }),
  component: Dashboard,
});

const stats: { label: string; value: number; delta: string; icon: typeof Database; format?: (n: number) => string }[] = [
  { label: "Knowledge Sources", value: 12, delta: "+2 this week", icon: Database },
  { label: "Indexed Documents", value: 284, delta: "+18 today", icon: FileText },
  { label: "Questions Asked", value: 1204, delta: "+47 today", icon: MessagesSquare },
  {
    label: "Today's Learning Time",
    value: 134,
    delta: "Goal 120m",
    icon: Clock,
    format: (n) => `${Math.floor(n / 60)}h ${n % 60}m`,
  },
];

const recentDocs = [
  { name: "Designing Data-Intensive Applications.pdf", size: "8.2 MB", chunks: 412, when: "2h ago" },
  { name: "Rust Book — Ownership.md", size: "42 KB", chunks: 28, when: "5h ago" },
  { name: "Transformer Architecture (Vaswani 2017).pdf", size: "1.4 MB", chunks: 96, when: "Yesterday" },
  { name: "Personal — Weekly Review Template.md", size: "12 KB", chunks: 6, when: "2d ago" },
];

const activity = [
  { text: "Finished indexing notion-export-2026.zip", when: "3m" },
  { text: "Asked about CAP theorem trade-offs", when: "27m" },
  { text: "Created note 'RAG retrieval tuning'", when: "1h" },
  { text: "Watching folder ~/Documents/Papers", when: "3h" },
];

function Dashboard() {
  const navigate = useNavigate();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <PageHeader
        title="Good afternoon, Alex"
        description="Your learning copilot is ready. Here's what's happening across your workspace."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => navigate({ to: "/knowledge" })}>
              <Search className="size-4" /> Quick search
            </Button>
            <Button size="sm" onClick={() => navigate({ to: "/chat" })}>
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
            whileHover={{ y: -2 }}
          >
            <Card className="group cursor-pointer border-border/80 transition-all duration-200 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/20">
              <CardContent className="p-5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                  <s.icon className="size-4 text-muted-foreground transition-colors group-hover:text-foreground" />
                </div>
                <div className="mt-3 text-2xl font-semibold tracking-tight tabular-nums">
                  <AnimatedCounter value={s.value} format={s.format} />
                </div>
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
          { icon: Upload, label: "Upload Document", hint: "PDF, MD, DOCX", onClick: () => setUploadOpen(true) },
          { icon: FolderPlus, label: "Add Folder", hint: "Watch local path", onClick: () => setFolderOpen(true) },
          { icon: NotebookPen, label: "Create Note", hint: "Markdown", onClick: () => navigate({ to: "/notes" }) },
          { icon: Sparkles, label: "Ask AI", hint: "Use your library", onClick: () => navigate({ to: "/chat" }) },
        ].map((a) => (
          <motion.button
            key={a.label}
            onClick={a.onClick}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="group relative flex items-center gap-3 rounded-xl border border-border bg-card p-4 text-left transition-colors hover:border-foreground/20 hover:bg-card/80"
          >
            <div className="grid size-9 place-items-center rounded-lg bg-muted text-foreground transition-colors group-hover:bg-accent/15 group-hover:text-accent">
              <a.icon className="size-4" />
            </div>
            <div className="min-w-0">
              <div className="text-sm font-medium">{a.label}</div>
              <div className="truncate text-xs text-muted-foreground">{a.hint}</div>
            </div>
            <ArrowUpRight className="ml-auto size-4 text-muted-foreground opacity-0 transition-all group-hover:translate-x-0.5 group-hover:opacity-100" />
          </motion.button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2 transition-shadow hover:shadow-lg hover:shadow-black/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent documents</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => navigate({ to: "/knowledge" })}
            >
              View all
            </Button>
          </CardHeader>
          <CardContent className="divide-y divide-border p-0">
            {recentDocs.map((d) => (
              <button
                key={d.name}
                onClick={() => toast(d.name, { description: `${d.size} · ${d.chunks} chunks` })}
                className="grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-3 px-6 py-3.5 text-left transition-colors hover:bg-muted/40"
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
              </button>
            ))}
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg hover:shadow-black/10">
          <CardHeader>
            <CardTitle className="text-base">Learning time</CardTitle>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-lg border border-border bg-surface/40 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">Today</div>
                <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
                  <AnimatedCounter value={134} format={(n) => `${Math.floor(n / 60)}h ${n % 60}m`} />
                </div>
              </div>
              <div className="rounded-lg border border-border bg-surface/40 p-3">
                <div className="text-[11px] uppercase tracking-wider text-muted-foreground">This week</div>
                <div className="mt-1 text-xl font-semibold tracking-tight tabular-nums">
                  <AnimatedCounter value={862} format={(n) => `${Math.floor(n / 60)}h ${n % 60}m`} />
                </div>
              </div>
            </div>
            <div>
              <div className="mb-2 flex items-center justify-between text-xs">
                <span className="text-muted-foreground">Weekly goal</span>
                <span className="text-muted-foreground tabular-nums">14h 22m / 20h</span>
              </div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: "72%" }}
                  transition={{ duration: 1.1, ease: "easeOut" }}
                  className="h-full rounded-full bg-accent"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="transition-shadow hover:shadow-lg hover:shadow-black/10">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-base">Recent notes</CardTitle>
            <Button
              variant="ghost"
              size="sm"
              className="text-xs text-muted-foreground"
              onClick={() => navigate({ to: "/notes" })}
            >
              Open notes
            </Button>
          </CardHeader>
          <CardContent className="space-y-2">
            {[
              { t: "RAG retrieval tuning", tag: "AI" },
              { t: "Weekly review — week 26", tag: "Personal" },
              { t: "Postgres index strategy", tag: "DB" },
            ].map((n) => (
              <motion.button
                key={n.t}
                whileHover={{ x: 2 }}
                onClick={() => navigate({ to: "/notes" })}
                className="flex w-full items-center justify-between rounded-lg border border-border bg-surface/40 p-3 text-left transition-colors hover:border-foreground/20 hover:bg-surface/70"
              >
                <div className="flex items-center gap-3">
                  <div className="size-1.5 rounded-full bg-accent" />
                  <span className="text-sm">{n.t}</span>
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  {n.tag}
                </Badge>
              </motion.button>
            ))}
          </CardContent>
        </Card>

        <Card className="transition-shadow hover:shadow-lg hover:shadow-black/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="size-4" /> Recent activity
            </CardTitle>
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

      <div>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-sm font-medium">Insights</h2>
          <span className="text-xs text-muted-foreground">Coming soon to your dashboard</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ComingSoonCard
            icon={TrendingUp}
            title="Learning analytics"
            description="Weekly trends, streaks, and a GitHub-style heatmap of your study sessions."
          />
          <ComingSoonCard
            icon={Sparkles}
            title="AI recommendations"
            description="Personalised topic suggestions and resources based on your knowledge base."
          />
          <ComingSoonCard
            icon={Activity}
            title="Smart goals"
            description="Predicted weak topics and goal tracking driven by your retention signal."
          />
        </div>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <AddFolderDialog open={folderOpen} onOpenChange={setFolderOpen} />
    </div>
  );
}

function AddFolderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const [path, setPath] = useState("~/Documents/Knowledge");
  const [watch, setWatch] = useState(true);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Add folder</DialogTitle>
          <DialogDescription>
            Watch a local folder. New files are ingested automatically.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs text-muted-foreground">Folder path</Label>
            <Input value={path} onChange={(e) => setPath(e.target.value)} className="mt-1.5 font-mono text-xs" />
          </div>
          <div className="flex items-center justify-between rounded-lg border border-border bg-surface/40 p-3">
            <div>
              <div className="text-sm font-medium">Watch for changes</div>
              <div className="text-xs text-muted-foreground">Auto-sync new and updated files</div>
            </div>
            <Switch checked={watch} onCheckedChange={setWatch} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              toast.success("Folder added", { description: path });
              onOpenChange(false);
            }}
          >
            Add folder
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
