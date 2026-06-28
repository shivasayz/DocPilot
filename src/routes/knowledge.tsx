import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
  Pause,
  Play,
  Search,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { UploadDialog } from "@/components/upload-dialog";
import { ConfirmDelete } from "@/components/confirm-delete";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

export const Route = createFileRoute("/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge Sources — Copilot" }] }),
  component: KnowledgePage,
});

type Source = {
  id: string;
  name: string;
  type: "folder" | "pdf" | "markdown" | "docx";
  status: "synced" | "indexing" | "paused";
  docs: number;
  chunks: number;
  last: string;
  auto: boolean;
};

const initial: Source[] = [
  { id: "1", name: "~/Documents/Research Papers", type: "folder", status: "synced", docs: 84, chunks: 4210, last: "Just now", auto: true },
  { id: "2", name: "Designing Data-Intensive Apps.pdf", type: "pdf", status: "synced", docs: 1, chunks: 412, last: "2h ago", auto: false },
  { id: "3", name: "Obsidian Vault — Engineering", type: "folder", status: "indexing", docs: 312, chunks: 1840, last: "Running", auto: true },
  { id: "4", name: "MIT 6.824 Lecture Notes.md", type: "markdown", status: "synced", docs: 22, chunks: 360, last: "Yesterday", auto: false },
];

function KnowledgePage() {
  const [drag, setDrag] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sources, setSources] = useState(initial);
  const [query, setQuery] = useState("");
  const [toDelete, setToDelete] = useState<Source | null>(null);

  // Animated pipeline
  const stages = ["Queued", "Parsing", "Chunking", "Embedding", "Completed"];
  const [pct, setPct] = useState(8);
  useEffect(() => {
    const t = setInterval(() => {
      setPct((p) => (p >= 100 ? 8 : p + 1));
    }, 180);
    return () => clearInterval(t);
  }, []);
  const activeStage = Math.min(stages.length - 1, Math.floor(pct / (100 / (stages.length - 1))));

  const filtered = sources.filter((s) => s.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <PageHeader
        title="Knowledge Sources"
        description="Documents and folders feeding your retrieval index."
        actions={
          <>
            <Button variant="outline" size="sm" onClick={() => toast("Folder picker coming on desktop")}>
              <FolderPlus className="size-4" /> Watch folder
            </Button>
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              <Upload className="size-4" /> Upload
            </Button>
          </>
        }
      />

      {/* Drop zone */}
      <motion.div
        whileHover={{ scale: 1.005 }}
        onClick={() => setUploadOpen(true)}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length) {
            setUploadOpen(true);
          }
        }}
        className={`relative grid cursor-pointer place-items-center rounded-xl border border-dashed p-10 text-center transition-colors ${
          drag ? "border-accent bg-accent/5" : "border-border bg-surface/40 hover:bg-surface/60"
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
          <Button variant="outline" size="sm" onClick={(e) => { e.stopPropagation(); setUploadOpen(true); }}>
            Browse files
          </Button>
        </div>
      </motion.div>

      {/* Active ingestion */}
      <Card>
        <CardContent className="p-5">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin text-accent" />
              <span className="text-sm font-medium">Indexing — Obsidian Vault — Engineering</span>
            </div>
            <Badge variant="secondary" className="text-[10px]">312 files</Badge>
          </div>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
            {stages.map((s, idx) => {
              const done = idx < activeStage;
              const active = idx === activeStage;
              return (
                <div
                  key={s}
                  className={`rounded-lg border p-3 transition-colors ${
                    active
                      ? "border-accent/50 bg-accent/5"
                      : done
                        ? "border-border bg-surface/60"
                        : "border-border/60 bg-surface/30"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium">{s}</span>
                    {done && <CheckCircle2 className="size-3.5 text-success" />}
                    {active && <Loader2 className="size-3.5 animate-spin text-accent" />}
                  </div>
                  {active && (
                    <>
                      <Progress value={pct} className="mt-3 h-1" />
                      <div className="mt-1 text-[10px] text-muted-foreground tabular-nums">{pct}%</div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Filter sources…"
          className="pl-9"
        />
      </div>

      {/* Sources grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-surface/30 p-10 text-center">
          <div className="mx-auto grid size-10 place-items-center rounded-lg bg-muted">
            <Folder className="size-4 text-muted-foreground" />
          </div>
          <h3 className="mt-3 text-sm font-medium">No sources match</h3>
          <p className="mt-1 text-xs text-muted-foreground">Try a different keyword or upload a new document.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((s, i) => (
            <motion.div
              key={s.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              whileHover={{ y: -2 }}
            >
              <Card className="group h-full transition-all duration-200 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/15">
                <CardContent className="p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 items-start gap-3">
                      <div className="grid size-9 shrink-0 place-items-center rounded-md bg-muted">
                        {s.type === "folder" ? <Folder className="size-4" /> : <FileText className="size-4" />}
                      </div>
                      <div className="min-w-0">
                        <div className="truncate text-sm font-medium">{s.name}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground capitalize">{s.type}</div>
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
                      <Switch
                        checked={s.auto}
                        onCheckedChange={(v) => {
                          setSources((arr) => arr.map((x) => (x.id === s.id ? { ...x, auto: v } : x)));
                          toast(v ? "Auto sync enabled" : "Auto sync paused", { description: s.name });
                        }}
                      />
                    </div>
                  </div>

                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => {
                        setSources((arr) => arr.map((x) => (x.id === s.id ? { ...x, status: "indexing" as const } : x)));
                        toast.success("Reindex started", { description: s.name });
                        setTimeout(() => {
                          setSources((arr) => arr.map((x) => (x.id === s.id ? { ...x, status: "synced" as const, last: "Just now" } : x)));
                          toast.success("Reindex complete", { description: s.name });
                        }, 2200);
                      }}
                    >
                      <RefreshCw className="size-3.5" /> Reindex
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSources((arr) =>
                          arr.map((x) =>
                            x.id === s.id ? { ...x, status: x.status === "paused" ? "synced" : "paused" } : x,
                          ),
                        );
                      }}
                      title={s.status === "paused" ? "Resume" : "Pause sync"}
                    >
                      {s.status === "paused" ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                      onClick={() => setToDelete(s)}
                    >
                      <Trash2 className="size-3.5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

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
            <Card key={i.name} className="opacity-70 transition-opacity hover:opacity-100">
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

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            setSources((arr) => arr.filter((x) => x.id !== toDelete.id));
            toast.success("Source deleted", { description: toDelete.name });
            setToDelete(null);
          }
        }}
        title="Delete source?"
        description={toDelete ? `"${toDelete.name}" and all its embeddings will be removed.` : ""}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md bg-surface/60 px-3 py-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium text-foreground tabular-nums">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { c: string; t: string }> = {
    synced: { c: "bg-success/15 text-success border-success/30", t: "Synced" },
    indexing: { c: "bg-accent/15 text-accent border-accent/30", t: "Indexing" },
    paused: { c: "bg-muted text-muted-foreground border-border", t: "Paused" },
    error: { c: "bg-destructive/15 text-destructive border-destructive/30", t: "Error" },
  };
  const v = map[status] ?? map.synced;
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${v.c}`}>{v.t}</span>
  );
}
