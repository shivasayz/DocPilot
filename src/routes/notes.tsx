import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Search,
  Pin,
  Star,
  Hash,
  Folder,
  Bold,
  Italic,
  Code,
  Heading1,
  Heading2,
  List,
  Link as LinkIcon,
  MoreHorizontal,
  Quote,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ConfirmDelete } from "@/components/confirm-delete";
import { toast } from "sonner";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Notes — Copilot" }] }),
  component: NotesPage,
});

type Note = {
  id: string;
  title: string;
  body: string;
  tag: string;
  date: string;
  pinned?: boolean;
  favorite?: boolean;
};

const initialNotes: Note[] = [
  {
    id: "1",
    title: "RAG retrieval tuning",
    tag: "ai",
    date: "Today",
    pinned: true,
    body: `After running retrieval evaluations across 200 questions, the sweet spot for technical PDFs sits around **chunk size 800 tokens** with **150 token overlap**.

## Findings

- Smaller chunks hurt recall on multi-paragraph reasoning.
- Larger chunks dilute the embedding signal.
- MMR diversity 0.4 reduced repetition in long contexts.

\`\`\`
retriever = MMR(top_k=8, diversity=0.4, embed_model="text-embedding-3-large")
\`\`\`
`,
  },
  {
    id: "2",
    title: "Weekly review — week 26",
    tag: "review",
    date: "Yesterday",
    body: "Shipped the knowledge sources page. Started on the ingest pipeline visualisation.",
  },
  {
    id: "3",
    title: "Transformer attention notes",
    tag: "papers",
    date: "Mon",
    body: "Q·Kᵀ / √d_k scales dot products to prevent softmax saturation when d_k is large.",
  },
  {
    id: "4",
    title: "Postgres index strategy",
    tag: "infra",
    date: "May 18",
    body: "B-tree for equality and range; GIN for JSONB and tsvector.",
  },
  {
    id: "5",
    title: "Rust lifetimes refresher",
    tag: "rust",
    date: "May 12",
    body: "Borrow checker rules: one mutable XOR many immutable refs.",
  },
];

const folders = [
  { key: "all", name: "All notes", icon: Folder },
  { key: "pinned", name: "Pinned", icon: Pin },
  { key: "favorites", name: "Favorites", icon: Star },
];

const tags = ["ai", "rust", "design", "review", "papers", "infra"];

function NotesPage() {
  const [notes, setNotes] = useState<Note[]>(initialNotes);
  const [folder, setFolder] = useState("all");
  const [tag, setTag] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState(initialNotes[0].id);
  const [toDelete, setToDelete] = useState<Note | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const filtered = useMemo(() => {
    return notes.filter((n) => {
      if (folder === "pinned" && !n.pinned) return false;
      if (folder === "favorites" && !n.favorite) return false;
      if (tag && n.tag !== tag) return false;
      if (query && !`${n.title} ${n.body}`.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
  }, [notes, folder, tag, query]);

  const active = notes.find((n) => n.id === activeId) ?? filtered[0];

  useEffect(() => {
    if (active && !filtered.find((n) => n.id === active.id) && filtered[0]) {
      setActiveId(filtered[0].id);
    }
  }, [filtered, active]);

  const updateActive = (patch: Partial<Note>) => {
    if (!active) return;
    setNotes((arr) => arr.map((n) => (n.id === active.id ? { ...n, ...patch } : n)));
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => setSaveState("saved"), 600);
  };

  const createNote = () => {
    const n: Note = {
      id: crypto.randomUUID(),
      title: "Untitled note",
      body: "",
      tag: tag ?? "ai",
      date: "Now",
    };
    setNotes((arr) => [n, ...arr]);
    setActiveId(n.id);
    toast.success("Note created");
  };

  const words = active ? active.body.trim().split(/\s+/).filter(Boolean).length : 0;
  const reading = Math.max(1, Math.round(words / 200));

  // toolbar action: wrap selection in markdown syntax
  const editorRef = useRef<HTMLTextAreaElement>(null);
  const wrap = (before: string, after = before) => {
    const ta = editorRef.current;
    if (!ta || !active) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const value = active.body;
    const sel = value.slice(start, end) || "text";
    const next = value.slice(0, start) + before + sel + after + value.slice(end);
    updateActive({ body: next });
    requestAnimationFrame(() => {
      ta.focus();
      ta.selectionStart = start + before.length;
      ta.selectionEnd = start + before.length + sel.length;
    });
  };

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[240px_320px_minmax(0,1fr)]">
      {/* Folders */}
      <aside className="hidden border-r border-border bg-sidebar/40 lg:flex lg:flex-col">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Notebooks
          </span>
          <Button size="icon" variant="ghost" className="size-7" onClick={createNote} title="New note">
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2">
          {folders.map((f) => {
            const I = f.icon;
            const count = notes.filter((n) =>
              f.key === "all" ? true : f.key === "pinned" ? n.pinned : n.favorite,
            ).length;
            return (
              <button
                key={f.key}
                onClick={() => {
                  setFolder(f.key);
                  setTag(null);
                }}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                  folder === f.key && !tag
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <I className="size-3.5" />
                  {f.name}
                </span>
                <span className="text-[11px] text-muted-foreground">{count}</span>
              </button>
            );
          })}
          <div className="mt-5 px-2.5 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Tags
          </div>
          <div className="flex flex-wrap gap-1 px-2">
            {tags.map((t) => (
              <button
                key={t}
                onClick={() => setTag(tag === t ? null : t)}
                className={`flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] transition-colors ${
                  tag === t ? "bg-accent/20 text-accent" : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                <Hash className="size-2.5" />
                {t}
              </button>
            ))}
          </div>
        </div>
      </aside>

      {/* Notes list */}
      <section className="hidden border-r border-border md:flex md:flex-col">
        <div className="border-b border-border p-3">
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search notes"
              className="h-8 w-full rounded-md border border-border bg-surface/60 pl-8 pr-2 text-sm outline-none transition-colors focus:border-ring"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <AnimatePresence initial={false}>
            {filtered.length === 0 && (
              <div className="px-4 py-10 text-center text-xs text-muted-foreground">No notes found.</div>
            )}
            {filtered.map((n) => (
              <motion.button
                key={n.id}
                layout
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setActiveId(n.id)}
                className={`block w-full border-b border-border px-4 py-3 text-left transition-colors ${
                  active?.id === n.id ? "bg-muted/60" : "hover:bg-muted/40"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="line-clamp-1 text-sm font-medium">{n.title}</span>
                  {n.pinned && <Pin className="size-3 text-accent" />}
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.body || "Empty note"}</p>
                <div className="mt-2 flex items-center justify-between">
                  <Badge variant="secondary" className="text-[10px]">#{n.tag}</Badge>
                  <span className="text-[11px] text-muted-foreground">{n.date}</span>
                </div>
              </motion.button>
            ))}
          </AnimatePresence>
        </div>
      </section>

      {/* Editor */}
      <section className="flex min-w-0 flex-col">
        {active ? (
          <>
            <div className="flex items-center justify-between border-b border-border px-4 py-2 md:px-6">
              <div className="flex items-center gap-0.5">
                <ToolBtn title="Heading 1" onClick={() => wrap("\n# ", "")}><Heading1 className="size-3.5" /></ToolBtn>
                <ToolBtn title="Heading 2" onClick={() => wrap("\n## ", "")}><Heading2 className="size-3.5" /></ToolBtn>
                <ToolBtn title="Bold" onClick={() => wrap("**")}><Bold className="size-3.5" /></ToolBtn>
                <ToolBtn title="Italic" onClick={() => wrap("*")}><Italic className="size-3.5" /></ToolBtn>
                <ToolBtn title="List" onClick={() => wrap("\n- ", "")}><List className="size-3.5" /></ToolBtn>
                <ToolBtn title="Quote" onClick={() => wrap("\n> ", "")}><Quote className="size-3.5" /></ToolBtn>
                <ToolBtn title="Code" onClick={() => wrap("`")}><Code className="size-3.5" /></ToolBtn>
                <ToolBtn title="Link" onClick={() => wrap("[", "](url)")}><LinkIcon className="size-3.5" /></ToolBtn>
              </div>
              <div className="flex items-center gap-1">
                <SaveIndicator state={saveState} />
                <Button
                  variant="ghost"
                  size="sm"
                  className={active.pinned ? "text-accent" : "text-muted-foreground"}
                  onClick={() => updateActive({ pinned: !active.pinned })}
                >
                  <Pin className="size-3.5" /> {active.pinned ? "Pinned" : "Pin"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className={active.favorite ? "text-warning" : "text-muted-foreground"}
                  onClick={() => updateActive({ favorite: !active.favorite })}
                >
                  <Star className="size-3.5" /> Favorite
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="size-7 text-muted-foreground hover:text-destructive"
                  onClick={() => setToDelete(active)}
                >
                  <Trash2 className="size-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="size-7">
                  <MoreHorizontal className="size-4" />
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto scrollbar-thin">
              <div className="mx-auto max-w-3xl px-6 py-10">
                <input
                  value={active.title}
                  onChange={(e) => updateActive({ title: e.target.value })}
                  className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none"
                  placeholder="Untitled"
                />
                <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                  <span>{active.date}</span>
                  <span>·</span>
                  <span className="tabular-nums">{words} words</span>
                  <span>·</span>
                  <span>{reading} min read</span>
                  <Badge variant="secondary" className="ml-1 text-[10px]">#{active.tag}</Badge>
                </div>

                <textarea
                  ref={editorRef}
                  value={active.body}
                  onChange={(e) => updateActive({ body: e.target.value })}
                  placeholder="Start writing… Markdown supported."
                  className="mt-8 min-h-[60vh] w-full resize-none bg-transparent font-mono text-sm leading-relaxed text-foreground/90 outline-none placeholder:text-muted-foreground"
                />
              </div>
            </div>
          </>
        ) : (
          <div className="grid flex-1 place-items-center">
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No note selected</p>
              <Button size="sm" className="mt-3" onClick={createNote}>
                <Plus className="size-4" /> New note
              </Button>
            </div>
          </div>
        )}
      </section>

      <ConfirmDelete
        open={!!toDelete}
        onOpenChange={(v) => !v && setToDelete(null)}
        onConfirm={() => {
          if (toDelete) {
            setNotes((arr) => arr.filter((n) => n.id !== toDelete.id));
            toast.success("Note deleted");
            setToDelete(null);
          }
        }}
        title="Delete note?"
        description={toDelete ? `"${toDelete.title}" will be permanently removed.` : ""}
      />
    </div>
  );
}

function ToolBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <Button variant="ghost" size="icon" className="size-7 text-muted-foreground hover:text-foreground" title={title} onClick={onClick}>
      {children}
    </Button>
  );
}

function SaveIndicator({ state }: { state: "idle" | "saving" | "saved" }) {
  return (
    <div className="mr-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
      {state === "saving" ? (
        <>
          <Loader2 className="size-3 animate-spin" /> Saving…
        </>
      ) : (
        <>
          <Check className="size-3 text-success" /> Saved
        </>
      )}
    </div>
  );
}
