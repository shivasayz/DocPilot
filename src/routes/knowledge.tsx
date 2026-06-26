import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  FolderPlus,
  Upload,
  RefreshCw,
  Trash2,
  FileText,
  Folder,
  CheckCircle2,
  Github,
  HardDrive,
  StickyNote,
  Loader2,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge Sources — Copilot" }] }),
  component: KnowledgePage,
});

const sources = [
  {
    name: "~/Documents/Research Papers",
    type: "folder",
    status: "synced",
    docs: 84,
    chunks: 4210,
    last: "Just now",
    auto: true,
  },
  {
    name: "Designing Data-Intensive Apps.pdf",
    type: "pdf",
    status: "synced",
    docs: 1,
    chunks: 412,
    last: "2h ago",
    auto: false,
  },
  {
    name: "Obsidian Vault — Engineering",
    type: "folder",
    status: "indexing",
    docs: 312,
    chunks: 1840,
    last: "Running",
    auto: true,
  },
  {
    name: "MIT 6.824 Lecture Notes.md",
    type: "markdown",
    status: "synced",
    docs: 22,
    chunks: 360,
    last: "Yesterday",
    auto: false,
  },
];

const pipeline = [
  { name: "Queued", done: true },
  { name: "Parsing", done: true },
  { name: "Chunking", done: true },
  { name: "Embedding", done: false, active: true, pct: 64 },
  { name: "Completed", done: false },
];

function KnowledgePage() {
  const [drag, setDrag] = useState(false);

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <PageHeader
        title="Knowledge Sources"
        description="Documents and folders feeding your retrieval index."
        actions={
          <>
            <Button variant="outline" size="sm">
              <FolderPlus className="size-4" /> Watch folder
            </Button>
            <Button size="sm">
              <Upload className="size-4" /> Upload
            </Button>
          </>
        }
      />

      {/* Drop zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
        }}
        className={`relative grid place-items-center rounded-xl border border-dashed p-10 text-center transition-colors ${
          drag ? "border-accent bg-accent/5" : "border-border bg-surface/40"
        }`}
      >
        <div className="grid size-12 place-items-center rounded-xl bg-muted">
          <Upload className="size-5" />
        </div>
        <h3 className="mt-4 text-sm font-medium">Drop PDFs, Markdown, or DOCX here</h3>
        <p className="mt-1 text-xs text-muted-foreground">
          Files are parsed, chunked, embedded, and indexed locally.
        </p>
        <div className="mt-4 flex gap-2">
          <Button variant="outline" size="sm">Browse files</Button>
          <Button variant="ghost" size="sm">
            <FolderPlus className="size-4" /> Add folder
          </Button>
        </div>
      </div>

      {/* Active ingestion */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-accent" />
              <span className="text-sm font-medium">
                Indexing — Obsidian Vault — Engineering
              </span>
            </div>
            <Badge variant="secondary" className="text-[10px]">312 files</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {pipeline.map((s) => (
              <div
                key={s.name}
                className={`rounded-lg border p-3 ${
                  s.active
                    ? "border-accent/50 bg-accent/5"
                    : s.done
                      ? "border-border bg-surface/60"
                      : "border-border/60 bg-surface/30"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium">{s.name}</span>
                  {s.done && <CheckCircle2 className="size-3.5 text-success" />}
                </div>
                {s.active && (
                  <>
                    <Progress value={s.pct} className="mt-3 h-1" />
                    <div className="mt-1 text-[10px] text-muted-foreground">{s.pct}%</div>
                  </>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sources grid */}
      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {sources.map((s, i) => (
          <motion.div
            key={s.name}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
          >
            <Card className="group h-full transition-colors hover:border-foreground/20">
              <CardContent className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex min-w-0 items-start gap-3">
                    <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted">
                      {s.type === "folder" ? (
                        <Folder className="size-4" />
                      ) : (
                        <FileText className="size-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-medium">{s.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground capitalize">
                        {s.type}
                      </div>
                    </div>
                  </div>
                  <StatusBadge status={s.status} />
                </div>

                <div className="mt-5 grid grid-cols-2 gap-3 text-xs">
                  <Stat label="Documents" value={s.docs.toLocaleString()} />
                  <Stat label="Chunks" value={s.chunks.toLocaleString()} />
                  <Stat label="Last indexed" value={s.last} />
                  <div className="flex items-center justify-between rounded-md bg-surface/60 px-3 py-2">
                    <span className="text-muted-foreground">Auto sync</span>
                    <Switch checked={s.auto} />
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <Button variant="outline" size="sm" className="flex-1">
                    <RefreshCw className="size-3.5" /> Reindex
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="size-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Future integrations */}
      <div>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-sm font-medium">Integrations</h2>
          <span className="text-xs text-muted-foreground">Coming soon</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          {[
            { name: "GitHub", desc: "Repos, issues, docs", icon: Github },
            { name: "Google Drive", desc: "Docs, sheets, slides", icon: HardDrive },
            { name: "Notion", desc: "Pages and databases", icon: StickyNote },
          ].map((i) => (
            <Card key={i.name} className="opacity-60">
              <CardContent className="flex items-center justify-between p-5">
                <div className="flex items-center gap-3">
                  <div className="grid size-9 place-items-center rounded-md bg-muted">
                    <i.icon className="size-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{i.name}</div>
                    <div className="text-xs text-muted-foreground">{i.desc}</div>
                  </div>
                </div>
                <Badge variant="outline" className="text-[10px]">Soon</Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface/60 px-3 py-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium text-foreground">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { c: string; t: string }> = {
    synced: { c: "bg-success/15 text-success border-success/30", t: "Synced" },
    indexing: { c: "bg-accent/15 text-accent border-accent/30", t: "Indexing" },
    error: { c: "bg-destructive/15 text-destructive border-destructive/30", t: "Error" },
  };
  const v = map[status] ?? map.synced;
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${v.c}`}>
      {v.t}
    </span>
  );
}
