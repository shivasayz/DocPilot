import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
import {
  Plus,
  Search,
  Pin,
  Star,
  Folder,
  Bold,
  Italic,
  Heading1,
  List,
  MoreHorizontal,
  Trash2,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ConfirmDelete } from "@/components/shared/confirm-delete";
import { MarkdownEditor } from "@/components/shared/markdown-editor";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import type { Editor } from "@/components/shared/markdown-editor";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Notes — DocPilot" }] }),
  component: NotesPage,
});

type NoteAPI = {
  id: string;
  title: string;
  content: string;
  pinned: boolean;
  favorite: boolean;
  user_id: string;
  created_at: string;
  updated_at: string;
};

type Note = {
  id: string;
  title: string;
  body: string;
  pinned?: boolean;
  favorite?: boolean;
  created_at: string;
  updated_at: string;
};

const folders = [
  { key: "all", name: "All notes", icon: Folder },
  { key: "pinned", name: "Pinned", icon: Pin },
  { key: "favorites", name: "Favorites", icon: Star },
];

function toNote(n: NoteAPI): Note {
  return { id: n.id, title: n.title, body: n.content, pinned: n.pinned, favorite: n.favorite, created_at: n.created_at, updated_at: n.updated_at };
}

function stripMarkdown(md: string): string {
  return md
    .replace(/#{1,6}\s?/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`(.*?)`/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/^[\s]*[-*+]\s/gm, "")
    .replace(/^>\s?/gm, "")
    .replace(/\n{2,}/g, " ")
    .trim();
}

function NotesPage() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [folder, setFolder] = useState("all");
  const [query, setQuery] = useState("");
  const [activeId, setActiveId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<Note | null>(null);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved">("saved");
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { getToken } = useAuth();
  const token = getToken() ?? "";

  const fetchNotes = useCallback(async () => {
    if (!token) { setLoading(false); return; }
    try {
      const data = await api<NoteAPI[]>("/notes/", { token });
      const mapped = data.map(toNote);
      setNotes(mapped);
      if (mapped.length > 0 && !activeId) setActiveId(mapped[0].id);
    } catch (e: any) {
      toast.error(e.message || "Failed to load notes");
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const filtered = useMemo(() => {
    return notes
      .filter((n) => {
        if (folder === "pinned" && !n.pinned) return false;
        if (folder === "favorites" && !n.favorite) return false;
        if (query && !`${n.title} ${n.body}`.toLowerCase().includes(query.toLowerCase())) return false;
        return true;
      })
      .sort((a, b) => (a.pinned === b.pinned ? 0 : a.pinned ? -1 : 1));
  }, [notes, folder, query]);

  const active = notes.find((n) => n.id === activeId) ?? filtered[0] ?? null;

  useEffect(() => {
    if (active && !filtered.find((n) => n.id === active.id) && filtered[0]) {
      setActiveId(filtered[0].id);
    }
  }, [filtered, active]);

  const updateActive = (patch: Partial<Note>) => {
    if (!active) return;
    const updated = { ...active, ...patch };
    setNotes((arr) => arr.map((n) => (n.id === active.id ? updated : n)));
    setSaveState("saving");
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(async () => {
      try {
        const body: Record<string, unknown> = {};
        if (patch.title !== undefined) body.title = patch.title;
        if (patch.body !== undefined) body.content = patch.body;
        if (patch.pinned !== undefined) body.pinned = patch.pinned;
        if (patch.favorite !== undefined) body.favorite = patch.favorite;
        if (Object.keys(body).length > 0) {
          await api(`/notes/${active.id}`, { method: "PATCH", body, token });
        }
        setSaveState("saved");
      } catch {
        setSaveState("idle");
      }
    }, 800);
  };

  const createNote = async () => {
    try {
      const data = await api<NoteAPI>("/notes/", {
        method: "POST",
        body: { title: "Untitled note", content: "" },
        token,
      });
      const n = toNote(data);
      setNotes((arr) => [n, ...arr]);
      setActiveId(n.id);
      toast.success("Note created");
    } catch (e: any) {
      toast.error(e.message || "Failed to create note");
    }
  };

  const deleteNote = async (note: Note) => {
    try {
      await api(`/notes/${note.id}`, { method: "DELETE", token });
      setNotes((arr) => arr.filter((n) => n.id !== note.id));
      toast.success("Note deleted");
      setToDelete(null);
    } catch (e: any) {
      toast.error(e.message || "Failed to delete note");
    }
  };

  const words = active ? active.body.trim().split(/\s+/).filter(Boolean).length : 0;
  const reading = Math.max(1, Math.round(words / 200));

  const editorRef = useRef<Editor | null>(null);

  if (loading) {
    return (
      <div className="grid h-[calc(100vh-3.5rem)] place-items-center">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

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
          <LayoutGroup>
            {folders.map((f) => {
              const I = f.icon;
              const count = notes.filter((n) =>
                f.key === "all" ? true : f.key === "pinned" ? n.pinned : n.favorite,
              ).length;
              const isActive = folder === f.key;
              return (
                <button
                  key={f.key}
                  onClick={() => setFolder(f.key)}
                  className={`relative flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm transition-colors ${
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:bg-muted/60"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="notes-folder-indicator"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute left-0 inset-y-1.5 w-[3px] rounded-full bg-accent"
                    />
                  )}
                  {isActive && (
                    <motion.span
                      layoutId="notes-folder-active"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute inset-0 rounded-md bg-accent/10"
                    />
                  )}
                  <span className="relative flex items-center gap-2">
                    <I className="size-3.5" />
                    {f.name}
                  </span>
                  <span className="relative text-[11px] text-muted-foreground">{count}</span>
                </button>
              );
            })}
          </LayoutGroup>
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
          <LayoutGroup>
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
                  className={`relative block w-full border-b border-border px-4 py-3 text-left transition-colors ${
                    active?.id === n.id ? "" : "hover:bg-muted/40"
                  }`}
                >
                  {active?.id === n.id && (
                    <motion.span
                      layoutId="notes-list-indicator"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute left-0 inset-y-2 w-[3px] rounded-full bg-accent"
                    />
                  )}
                  {active?.id === n.id && (
                    <motion.span
                      layoutId="notes-list-active"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                      className="absolute inset-x-1 inset-y-1 rounded-md bg-accent/10"
                    />
                  )}
                  <div className="relative">
                    <div className="flex items-center justify-between">
                      <span className="line-clamp-1 text-sm font-medium">{n.title}</span>
                      {n.pinned && <Pin className="size-3 text-accent" />}
                    </div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{stripMarkdown(n.body) || "Empty note"}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-muted-foreground">
                        {new Date(n.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </motion.button>
              ))}
            </AnimatePresence>
          </LayoutGroup>
        </div>
      </section>

      {/* Editor */}
      <section className="flex min-w-0 flex-col">
        {active ? (
          <>
            <div className="flex items-center justify-between border-b border-border px-4 py-2 md:px-6">
              <div className="flex items-center gap-0.5">
                <ToolBtn title="Heading" onClick={() => editorRef.current?.chain().focus().toggleHeading({ level: 1 }).run()}><Heading1 className="size-3.5" /></ToolBtn>
                <ToolBtn title="Bold" onClick={() => editorRef.current?.chain().focus().toggleBold().run()}><Bold className="size-3.5" /></ToolBtn>
                <ToolBtn title="Italic" onClick={() => editorRef.current?.chain().focus().toggleItalic().run()}><Italic className="size-3.5" /></ToolBtn>
                <ToolBtn title="List" onClick={() => editorRef.current?.chain().focus().toggleBulletList().run()}><List className="size-3.5" /></ToolBtn>
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
                  <span>{new Date(active.updated_at).toLocaleDateString()}</span>
                  <span>·</span>
                  <span className="tabular-nums">{words} words</span>
                  <span>·</span>
                  <span>{reading} min read</span>
                </div>

                <div className="mt-8">
                  <MarkdownEditor
                    noteId={active.id}
                    initialContent={active.body}
                    onChange={(md) => updateActive({ body: md })}
                    editorRef={editorRef}
                  />
                </div>
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
        onConfirm={() => { if (toDelete) deleteNote(toDelete); }}
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
