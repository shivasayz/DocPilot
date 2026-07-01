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
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { AnimatedCounter } from "@/components/shared/animated-counter";
import { UploadDialog } from "@/components/shared/upload-dialog";
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
import { useAuth } from "@/lib/auth";

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

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function Dashboard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [folderOpen, setFolderOpen] = useState(false);

  const firstName = user?.name?.split(" ")[0] ?? "there";

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <PageHeader
        title={`${getGreeting()}, ${firstName}`}
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

      {/* Quick Access */}
      <div>
        <h2 className="mb-3 text-sm font-medium">Quick Access</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
          {[
            { icon: Upload, label: "Upload Document", hint: "PDF, MD, DOCX", onClick: () => setUploadOpen(true) },
            { icon: FolderPlus, label: "Add Folder", hint: "Watch local path", onClick: () => setFolderOpen(true) },
            { icon: NotebookPen, label: "Create Note", hint: "Markdown", onClick: () => navigate({ to: "/notes" }) },
            { icon: Sparkles, label: "Ask AI", hint: "Use your library", onClick: () => navigate({ to: "/chat" }) },
          ].map((a) => (
            <motion.button
              key={a.label}
              onClick={a.onClick}
              whileHover={{ y: -3 }}
              whileTap={{ scale: 0.97 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="group relative flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-6 text-center transition-colors hover:border-foreground/20 hover:bg-card/80"
            >
              <div className="grid size-12 place-items-center rounded-xl bg-muted text-foreground transition-colors group-hover:bg-accent/15 group-hover:text-accent">
                <a.icon className="size-5" />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-medium">{a.label}</div>
                <div className="mt-0.5 truncate text-xs text-muted-foreground">{a.hint}</div>
              </div>
              <ArrowUpRight className="absolute right-3 top-3 size-4 text-muted-foreground opacity-0 transition-all group-hover:opacity-100" />
            </motion.button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        <Card className="transition-shadow hover:shadow-lg hover:shadow-black/10">
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
