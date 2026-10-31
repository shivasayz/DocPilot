import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
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
  Search,
  NotebookPen,
  FileSpreadsheet,
  FileType2,
  ArrowUpRight,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/shared/page-header";
import { UploadDialog } from "@/components/shared/upload-dialog";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import {
  api,
  deleteKnowledgeSource,
  ingestKnowledgeSources,
  listKnowledgeSources,
  type KnowledgeSource,
} from "@/lib/api";

export const Route = createFileRoute("/knowledge")({
  head: () => ({ meta: [{ title: "Knowledge Sources — DocPilot" }] }),
  component: KnowledgePage,
});

type NoteAPI = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  favorite: boolean;
  updated_at: string;
  created_at: string;
};

const stages = ["Queued", "Parsing", "Chunking", "Embedding", "Completed"];

function parseUtc(iso: string) {
  // Bare ISO from Python (no Z) is UTC — force that so local TZ doesn't shift it.
  const normalized =
    /Z$|[+-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}Z`;
  return new Date(normalized);
}

function formatLast(iso: string | null | undefined, status?: string) {
  if (status === "pending") return "Not indexed";
  if (!iso) return "—";
  const d = parseUtc(iso);
  if (Number.isNaN(d.getTime())) return "—";
  const diff = Date.now() - d.getTime();
  if (diff < 60_000) return "Just now";
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return d.toLocaleDateString();
}

function formatSize(bytes: number) {
  if (!bytes) return "—";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function uiStatus(status: string, indexing: boolean): "synced" | "indexing" | "pending" {
  if (indexing) return "indexing";
  if (status === "indexed") return "synced";
  return "pending";
}

function fileIcon(type: string) {
  const t = type.toLowerCase();
  if (t === "notes" || t === "note") return StickyNote;
  if (t === "csv" || t === "xlsx" || t === "xls") return FileSpreadsheet;
  if (t === "pdf" || t === "docx" || t === "doc") return FileType2;
  return FileText;
}

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[\s]*[-*+]\s/gm, "")
    .replace(/\n+/g, " ")
    .trim();
}

function KnowledgePage() {
  const navigate = useNavigate();
  const [drag, setDrag] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [sources, setSources] = useState<KnowledgeSource[]>([]);
  const [notes, setNotes] = useState<NoteAPI[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"all" | "docs" | "notes">("all");
  const [toDelete, setToDelete] = useState<KnowledgeSource | null>(null);
  const [indexing, setIndexing] = useState(false);
  const [pct, setPct] = useState(0);

  const loadSources = useCallback(async () => {
    const token = getToken() ?? undefined;
    if (!token) {
      setSources([]);
      setNotes([]);
      setLoading(false);
      return;
    }
    try {
      const [data, noteList] = await Promise.all([
        listKnowledgeSources(token),
        api<NoteAPI[]>("/notes/", { token }),
      ]);
      setSources(data);
      setNotes(noteList);
    } catch (e: any) {
      toast.error("Failed to load sources", { description: e.message });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSources();
  }, [loadSources]);

  useEffect(() => {
    if (!indexing) {
      setPct(0);
      return;
    }
    setPct(8);
    const t = setInterval(() => {
      setPct((p) => (p >= 92 ? 92 : p + 3));
    }, 400);
    return () => clearInterval(t);
  }, [indexing]);

  const activeStage = indexing
    ? Math.min(stages.length - 2, Math.floor(pct / (100 / (stages.length - 1))))
    : stages.length - 1;

  const fileSources = useMemo(
    () => sources.filter((s) => s.type !== "notes" && s.id !== "notes"),
    [sources],
  );
  const notesAggregate = useMemo(
    () => sources.find((s) => s.type === "notes" || s.id === "notes"),
    [sources],
  );

  const runIngest = async () => {
    const token = getToken() ?? undefined;
    if (!token) {
      toast.error("Please log in first");
      return;
    }
    if (!fileSources.length && !notes.length) {
      toast.error("Add documents or notes before indexing");
      return;
    }
    setIndexing(true);
    try {
      const result = await ingestKnowledgeSources(token);
      setPct(100);
      toast.success("Indexing complete", {
        description: [
          `${result.chunks_count} chunks`,
          `${result.documents_loaded} docs`,
          `${result.notes_loaded ?? 0} notes`,
          result.orphans_removed ? `${result.orphans_removed} orphans cleaned` : null,
        ]
          .filter(Boolean)
          .join(" · "),
      });
      await loadSources();
    } catch (e: any) {
      toast.error("Indexing failed", { description: e.message });
    } finally {
      setIndexing(false);
    }
  };

  const q = query.toLowerCase().trim();

  const filteredDocs = fileSources.filter((s) => {
    if (!q) return true;
    return (
      s.name?.toLowerCase().includes(q) ||
      s.file_name?.toLowerCase().includes(q) ||
      s.type?.toLowerCase().includes(q)
    );
  });

  const filteredNotes = notes.filter((n) => {
    if (!q) return true;
    return (
      n.title?.toLowerCase().includes(q) ||
      n.content?.toLowerCase().includes(q)
    );
  });

  const totalChunks =
    fileSources.reduce((sum, s) => sum + (s.chunks_count || 0), 0) +
    (notesAggregate?.chunks_count || 0);
  const indexedDocs = fileSources.filter((s) => s.status === "indexed").length;
  const pendingCount =
    fileSources.filter((s) => s.status !== "indexed").length +
    (notes.length && notesAggregate?.status !== "indexed" ? 1 : 0);

  const showDocs = filter === "all" || filter === "docs";
  const showNotes = filter === "all" || filter === "notes";

  return (
    <div className="relative mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-56 bg-[radial-gradient(ellipse_at_top,color-mix(in_oklab,var(--accent)_18%,transparent),transparent_65%)]" />

      <PageHeader
        title="Knowledge Sources"
        description="Documents and notes that power your retrieval index."
        actions={
          <>
            <Button
              variant="outline"
              size="sm"
              onClick={runIngest}
              disabled={indexing || (!fileSources.length && !notes.length)}
            >
              {indexing ? <Loader2 className="size-4 animate-spin" /> : <RefreshCw className="size-4" />}
              {indexing ? "Indexing…" : "Index all"}
            </Button>
            <Button size="sm" onClick={() => setUploadOpen(true)}>
              <Upload className="size-4" /> Upload
            </Button>
          </>
        }
      />

      {/* Summary strip */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {[
          { label: "Documents", value: fileSources.length, hint: `${indexedDocs} indexed` },
          { label: "Notes", value: notes.length, hint: notesAggregate?.status === "indexed" ? "In index" : "Needs index" },
          { label: "Chunks", value: totalChunks, hint: "Across all sources" },
          { label: "Pending", value: pendingCount, hint: pendingCount ? "Re-index needed" : "All synced" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.04 }}
          >
            <Card className="border-border/70 bg-surface/50 backdrop-blur-sm">
              <CardContent className="p-4">
                <div className="text-[11px] uppercase tracking-wide text-muted-foreground">{stat.label}</div>
                <div className="mt-1 text-2xl font-semibold tabular-nums tracking-tight">{stat.value}</div>
                <div className="mt-0.5 text-[11px] text-muted-foreground">{stat.hint}</div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>

      {/* Drop zone */}
      <motion.div
        whileHover={{ scale: 1.004 }}
        onClick={() => setUploadOpen(true)}
        onDragOver={(e) => {
          e.preventDefault();
          setDrag(true);
        }}
        onDragLeave={() => setDrag(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDrag(false);
          if (e.dataTransfer.files.length) setUploadOpen(true);
        }}
        className={`relative overflow-hidden rounded-2xl border border-dashed p-8 text-center transition-colors md:p-10 ${
          drag
            ? "border-accent bg-accent/10"
            : "border-border/80 bg-gradient-to-br from-surface/80 via-surface/40 to-transparent hover:border-foreground/20"
        }`}
      >
        <div className="pointer-events-none absolute -right-10 -top-10 size-40 rounded-full bg-accent/10 blur-2xl" />
        <div className="relative mx-auto grid size-14 place-items-center rounded-2xl border border-border/60 bg-muted/70 shadow-sm">
          <Upload className="size-5" />
        </div>
        <h3 className="relative mt-4 text-sm font-medium">Drop PDFs, Markdown, DOCX, CSV, or XLSX</h3>
        <p className="relative mt-1 text-xs text-muted-foreground">
          Upload files, then Index all. Notes from your Notes page are included automatically.
        </p>
        <div className="relative mt-5 flex flex-wrap items-center justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setUploadOpen(true);
            }}
          >
            Browse files
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate({ to: "/notes" });
            }}
          >
            <NotebookPen className="size-3.5" /> Open notes
          </Button>
        </div>
      </motion.div>

      {/* Pipeline */}
      {(indexing || sources.some((s) => s.status === "indexed")) && (
        <Card className="overflow-hidden border-border/70">
          <CardContent className="p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                {indexing ? (
                  <Loader2 className="size-4 animate-spin text-accent" />
                ) : (
                  <CheckCircle2 className="size-4 text-success" />
                )}
                <span className="text-sm font-medium">
                  {indexing ? "Indexing documents & notes…" : "Retrieval index ready"}
                </span>
              </div>
              <Badge variant="secondary" className="text-[10px]">
                {fileSources.length} docs · {notes.length} notes
                {pendingCount > 0 ? ` · ${pendingCount} pending` : ""}
              </Badge>
            </div>
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
              {stages.map((s, idx) => {
                const done = indexing ? idx < activeStage : true;
                const active = indexing && idx === activeStage;
                return (
                  <div
                    key={s}
                    className={`rounded-xl border p-3 transition-colors ${
                      active
                        ? "border-accent/50 bg-accent/10"
                        : done
                          ? "border-border bg-surface/70"
                          : "border-border/50 bg-surface/20"
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-medium">{s}</span>
                      {done && !active && <CheckCircle2 className="size-3.5 text-success" />}
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
      )}

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1.5 rounded-lg border border-border/70 bg-surface/40 p-1">
          {(
            [
              { key: "all", label: "All" },
              { key: "docs", label: `Documents (${fileSources.length})` },
              { key: "notes", label: `Notes (${notes.length})` },
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => setFilter(tab.key)}
              className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === tab.key
                  ? "bg-muted text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search documents and notes…"
            className="pl-9"
          />
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Loading sources…
        </div>
      ) : (
        <div className="space-y-8">
          {/* Documents */}
          {showDocs && (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FileText className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium">Documents</h2>
                  <Badge variant="outline" className="text-[10px]">{filteredDocs.length}</Badge>
                </div>
              </div>

              {filteredDocs.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface/30 p-8 text-center">
                  <div className="mx-auto grid size-10 place-items-center rounded-lg bg-muted">
                    <Folder className="size-4 text-muted-foreground" />
                  </div>
                  <h3 className="mt-3 text-sm font-medium">
                    {fileSources.length ? "No documents match" : "No documents yet"}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {fileSources.length ? "Try a different keyword." : "Upload a PDF, DOCX, or other file to begin."}
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredDocs.map((s, i) => {
                    const status = uiStatus(s.status, indexing);
                    const Icon = fileIcon(s.type);
                    return (
                      <motion.div
                        key={s.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        whileHover={{ y: -2 }}
                      >
                        <Card className="group h-full overflow-hidden border-border/80 transition-all duration-200 hover:border-foreground/20 hover:shadow-lg hover:shadow-black/15">
                          <div className="h-1 w-full bg-gradient-to-r from-accent/70 via-accent/30 to-transparent opacity-70" />
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-border/60 bg-muted/80">
                                  <Icon className="size-4" />
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium">{s.file_name || s.name}</div>
                                  <div className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
                                    {s.type}
                                  </div>
                                </div>
                              </div>
                              <StatusBadge status={status} />
                            </div>

                            <div className="mt-5 grid grid-cols-2 gap-2.5 text-xs">
                              <Stat label="Size" value={formatSize(s.file_size)} />
                              <Stat label="Chunks" value={s.chunks_count.toLocaleString()} />
                              <Stat label="Last indexed" value={formatLast(s.last_indexed_at, s.status)} />
                              <Stat label="Status" value={s.status} />
                            </div>

                            <div className="mt-4 flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1"
                                disabled={indexing}
                                onClick={runIngest}
                              >
                                <RefreshCw className="size-3.5" /> Reindex
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
                    );
                  })}
                </div>
              )}
            </section>
          )}

          {/* Notes */}
          {showNotes && (
            <section className="space-y-3">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <StickyNote className="size-4 text-muted-foreground" />
                  <h2 className="text-sm font-medium">Notes</h2>
                  <Badge variant="outline" className="text-[10px]">{filteredNotes.length}</Badge>
                  {notesAggregate && (
                    <StatusBadge status={uiStatus(notesAggregate.status, indexing)} />
                  )}
                </div>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => navigate({ to: "/notes" })}>
                  Manage notes <ArrowUpRight className="size-3.5" />
                </Button>
              </div>

              {notes.length > 0 && (
                <Card className="border-accent/20 bg-accent/[0.04]">
                  <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
                    <div className="min-w-0">
                      <div className="text-sm font-medium">Notes are part of your knowledge base</div>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {notesAggregate?.chunks_count
                          ? `${notesAggregate.chunks_count} note chunks in the index`
                          : "Index all to embed these notes for chat retrieval"}
                        {" · "}
                        Last indexed {formatLast(notesAggregate?.last_indexed_at, notesAggregate?.status)}
                      </p>
                    </div>
                    <Button size="sm" variant="outline" disabled={indexing} onClick={runIngest}>
                      {indexing ? <Loader2 className="size-3.5 animate-spin" /> : <RefreshCw className="size-3.5" />}
                      Index notes
                    </Button>
                  </CardContent>
                </Card>
              )}

              {filteredNotes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface/30 p-8 text-center">
                  <div className="mx-auto grid size-10 place-items-center rounded-lg bg-muted">
                    <NotebookPen className="size-4 text-muted-foreground" />
                  </div>
                  <h3 className="mt-3 text-sm font-medium">
                    {notes.length ? "No notes match" : "No notes yet"}
                  </h3>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {notes.length
                      ? "Try a different keyword."
                      : "Create notes on the Notes page — they’ll appear here and get indexed with your docs."}
                  </p>
                  {!notes.length && (
                    <Button size="sm" className="mt-4" onClick={() => navigate({ to: "/notes" })}>
                      <NotebookPen className="size-3.5" /> Go to Notes
                    </Button>
                  )}
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
                  {filteredNotes.map((n, i) => (
                    <motion.div
                      key={n.id}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.03 }}
                      whileHover={{ y: -2 }}
                    >
                      <button
                        type="button"
                        onClick={() => navigate({ to: "/notes" })}
                        className="h-full w-full text-left"
                      >
                        <Card className="group h-full overflow-hidden border-border/80 transition-all duration-200 hover:border-accent/40 hover:shadow-lg hover:shadow-black/15">
                          <div className="h-1 w-full bg-gradient-to-r from-warning/70 via-accent/40 to-transparent opacity-80" />
                          <CardContent className="p-5">
                            <div className="flex items-start justify-between gap-3">
                              <div className="flex min-w-0 items-start gap-3">
                                <div className="grid size-10 shrink-0 place-items-center rounded-xl border border-accent/20 bg-accent/10">
                                  <StickyNote className="size-4 text-accent" />
                                </div>
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-medium">{n.title || "Untitled"}</div>
                                  <div className="mt-0.5 text-xs text-muted-foreground">
                                    Updated {formatLast(n.updated_at)}
                                  </div>
                                </div>
                              </div>
                              <div className="flex shrink-0 gap-1">
                                {n.pinned && (
                                  <Badge variant="secondary" className="text-[10px]">
                                    Pinned
                                  </Badge>
                                )}
                                {n.favorite && (
                                  <Badge variant="outline" className="text-[10px]">
                                    Favorite
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <p className="mt-4 line-clamp-3 text-xs leading-relaxed text-muted-foreground">
                              {stripMarkdown(n.content) || "Empty note"}
                            </p>
                            <div className="mt-4 flex items-center justify-between text-[11px] text-muted-foreground">
                              <span>Included in RAG when indexed</span>
                              <ArrowUpRight className="size-3.5 opacity-0 transition-opacity group-hover:opacity-100" />
                            </div>
                          </CardContent>
                        </Card>
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>
      )}

      {/* Integrations */}
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
                <Badge variant="outline" className="text-[10px]">
                  Soon
                </Badge>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      <UploadDialog open={uploadOpen} onOpenChange={setUploadOpen} onUploaded={loadSources} />
      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        onConfirm={async () => {
          if (!toDelete) return;
          const token = getToken() ?? undefined;
          try {
            await deleteKnowledgeSource(toDelete.id, token);
            setSources((arr) => arr.filter((x) => x.id !== toDelete.id));
            toast.success("Source deleted", {
              description: `${toDelete.file_name}. Re-run Index all to refresh the vector store.`,
            });
          } catch (e: any) {
            toast.error("Delete failed", { description: e.message });
          } finally {
            setToDelete(null);
          }
        }}
        title="Delete source?"
        description={
          toDelete
            ? `"${toDelete.file_name}" will be removed. Re-index afterward to update FAISS.`
            : ""
        }
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-surface/70 px-3 py-2">
      <div className="text-muted-foreground">{label}</div>
      <div className="mt-0.5 font-medium text-foreground tabular-nums">{value}</div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { c: string; t: string }> = {
    synced: { c: "bg-success/15 text-success border-success/30", t: "Synced" },
    indexing: { c: "bg-accent/15 text-accent border-accent/30", t: "Indexing" },
    pending: { c: "bg-muted text-muted-foreground border-border", t: "Pending" },
  };
  const v = map[status] ?? map.pending;
  return (
    <span className={`shrink-0 rounded-full border px-2 py-0.5 text-[10px] font-medium ${v.c}`}>{v.t}</span>
  );
}
