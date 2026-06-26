import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
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
  List,
  Link as LinkIcon,
  MoreHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/notes")({
  head: () => ({ meta: [{ title: "Notes — Copilot" }] }),
  component: NotesPage,
});

const folders = [
  { name: "All notes", count: 124, active: true },
  { name: "Pinned", count: 6, icon: Pin },
  { name: "Favorites", count: 12, icon: Star },
  { name: "Research", count: 34 },
  { name: "Personal", count: 22 },
  { name: "Engineering", count: 50 },
];

const tags = ["ai", "rust", "design", "review", "papers", "infra"];

const notes = [
  { id: 1, title: "RAG retrieval tuning", excerpt: "Top-k = 8 with MMR diversity 0.4 produced the best…", tag: "ai", date: "Today", pinned: true },
  { id: 2, title: "Weekly review — week 26", excerpt: "Shipped knowledge sources page. Started ingest pipeline…", tag: "review", date: "Yesterday" },
  { id: 3, title: "Transformer attention notes", excerpt: "Q·Kᵀ / √d_k scales dot products to prevent softmax saturation…", tag: "papers", date: "Mon" },
  { id: 4, title: "Postgres index strategy", excerpt: "B-tree for equality and range; GIN for JSONB and tsvector…", tag: "infra", date: "May 18" },
  { id: 5, title: "Rust lifetimes refresher", excerpt: "Borrow checker rules: one mutable XOR many immutable refs…", tag: "rust", date: "May 12" },
];

function NotesPage() {
  const [active, setActive] = useState(notes[0]);

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[240px_320px_minmax(0,1fr)]">
      {/* Folders */}
      <aside className="hidden border-r border-border bg-sidebar/40 lg:flex lg:flex-col">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Notebooks
          </span>
          <Button size="icon" variant="ghost" className="size-7">
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2">
          {folders.map((f) => {
            const I = f.icon ?? Folder;
            return (
              <button
                key={f.name}
                className={`flex w-full items-center justify-between rounded-md px-2.5 py-1.5 text-sm ${
                  f.active ? "bg-muted text-foreground" : "text-muted-foreground hover:bg-muted/60"
                }`}
              >
                <span className="flex items-center gap-2">
                  <I className="size-3.5" />
                  {f.name}
                </span>
                <span className="text-[11px] text-muted-foreground">{f.count}</span>
              </button>
            );
          })}
          <div className="mt-5 px-2.5 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            Tags
          </div>
          <div className="flex flex-wrap gap-1 px-2">
            {tags.map((t) => (
              <span key={t} className="flex items-center gap-1 rounded-md bg-muted/60 px-2 py-0.5 text-[11px] text-muted-foreground">
                <Hash className="size-2.5" />{t}
              </span>
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
              placeholder="Search notes"
              className="h-8 w-full rounded-md border border-border bg-surface/60 pl-8 pr-2 text-sm outline-none focus:border-ring"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin">
          {notes.map((n) => (
            <button
              key={n.id}
              onClick={() => setActive(n)}
              className={`block w-full border-b border-border px-4 py-3 text-left transition-colors ${
                active.id === n.id ? "bg-muted/60" : "hover:bg-muted/40"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="line-clamp-1 text-sm font-medium">{n.title}</span>
                {n.pinned && <Pin className="size-3 text-accent" />}
              </div>
              <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{n.excerpt}</p>
              <div className="mt-2 flex items-center justify-between">
                <Badge variant="secondary" className="text-[10px]">#{n.tag}</Badge>
                <span className="text-[11px] text-muted-foreground">{n.date}</span>
              </div>
            </button>
          ))}
        </div>
      </section>

      {/* Editor */}
      <section className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-2 md:px-6">
          <div className="flex items-center gap-1">
            {[Heading1, Bold, Italic, List, Code, LinkIcon].map((I, i) => (
              <Button key={i} variant="ghost" size="icon" className="size-7 text-muted-foreground">
                <I className="size-3.5" />
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Star className="size-3.5" /> Favorite
            </Button>
            <Button variant="ghost" size="icon" className="size-7">
              <MoreHorizontal className="size-4" />
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-3xl px-6 py-10">
            <input
              defaultValue={active.title}
              className="w-full bg-transparent text-3xl font-semibold tracking-tight outline-none"
            />
            <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
              <span>{active.date}</span>
              <span>·</span>
              <span>3 min read</span>
              <Badge variant="secondary" className="ml-1 text-[10px]">#{active.tag}</Badge>
            </div>

            <div className="prose prose-invert mt-8 max-w-none text-sm leading-relaxed text-foreground/90">
              <p>
                After running retrieval evaluations across 200 questions, the
                sweet spot for technical PDFs sits around{" "}
                <strong>chunk size 800 tokens</strong> with{" "}
                <strong>150 token overlap</strong>.
              </p>
              <h2 className="mt-6 text-lg font-semibold">Findings</h2>
              <ul className="ml-5 list-disc space-y-1.5">
                <li>Smaller chunks hurt recall on multi-paragraph reasoning.</li>
                <li>Larger chunks dilute the embedding signal.</li>
                <li>MMR diversity 0.4 reduced repetition in long contexts.</li>
              </ul>
              <pre className="mt-4 overflow-x-auto rounded-lg border border-border bg-surface/60 p-3 text-xs">
{`retriever = MMR(top_k=8, diversity=0.4, embed_model="text-embedding-3-large")`}
              </pre>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
