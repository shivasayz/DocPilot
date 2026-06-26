import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion } from "framer-motion";
import {
  Send,
  Plus,
  Sparkles,
  Copy,
  RefreshCw,
  Square,
  Trash2,
  FileText,
  ChevronDown,
  MessagesSquare,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "AI Chat — Copilot" }] }),
  component: ChatPage,
});

const threads = [
  { id: "1", title: "CAP theorem trade-offs", when: "2h", active: true },
  { id: "2", title: "RAG chunk size tuning", when: "Yesterday" },
  { id: "3", title: "Comparing vector DBs", when: "Mon" },
  { id: "4", title: "Rust lifetimes refresher", when: "May 18" },
  { id: "5", title: "Postgres index strategies", when: "May 12" },
];

const suggested = [
  "Summarize my notes on retrieval augmentation",
  "What did Vaswani et al. (2017) say about attention?",
  "Quiz me on Raft consensus",
];

const sources = [
  { title: "Designing Data-Intensive Apps.pdf", page: "p. 312", snippet: "In a partitioned system, the CAP theorem states…" },
  { title: "MIT 6.824 — Lecture 5.md", page: "§3", snippet: "Linearizability requires a real-time ordering…" },
];

function ChatPage() {
  const [input, setInput] = useState("");

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Threads */}
      <aside className="hidden border-r border-border bg-sidebar/40 lg:flex lg:flex-col">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Conversations
          </span>
          <Button size="icon" variant="ghost" className="size-7">
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-3">
          {threads.map((t) => (
            <button
              key={t.id}
              className={`group flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors ${
                t.active ? "bg-muted" : "hover:bg-muted/60"
              }`}
            >
              <span className="line-clamp-1 text-sm">{t.title}</span>
              <span className="text-[11px] text-muted-foreground">{t.when}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-border p-3">
          <Button variant="ghost" size="sm" className="w-full justify-start text-muted-foreground">
            <Trash2 className="size-3.5" /> Clear all
          </Button>
        </div>
      </aside>

      {/* Chat surface */}
      <section className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <MessagesSquare className="size-4 text-muted-foreground" />
            <span className="truncate text-sm font-medium">CAP theorem trade-offs</span>
          </div>
          <div className="flex items-center gap-1">
            <Button variant="ghost" size="sm">
              <RefreshCw className="size-3.5" /> Regenerate
            </Button>
            <Button variant="ghost" size="sm" className="text-muted-foreground">
              <Square className="size-3.5" /> Stop
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-3xl space-y-8 px-4 py-8 md:px-6">
            {/* User msg */}
            <Message role="user">
              In a distributed key-value store, how do I reason about the CAP
              theorem when choosing between Raft and a leaderless design?
            </Message>

            {/* AI msg */}
            <Message role="assistant">
              <p>
                The CAP theorem forces a runtime trade-off between{" "}
                <strong>consistency</strong> and <strong>availability</strong> when
                a partition occurs. Two practical models:
              </p>
              <ul className="ml-5 list-disc space-y-1">
                <li>
                  <strong>Raft / leader-based</strong>: prioritises consistency.
                  Writes go through an elected leader; if the leader is
                  partitioned, writes pause until a new quorum forms.
                </li>
                <li>
                  <strong>Leaderless (Dynamo-style)</strong>: prioritises
                  availability. Multiple replicas accept writes concurrently;
                  conflicts are resolved later with vector clocks or CRDTs.
                </li>
              </ul>
              <p>
                For your read-heavy workload with strict ordering, Raft is the
                safer default — combine it with <code>read_index</code> for
                low-latency consistent reads.
              </p>

              <Collapsible className="mt-4 rounded-lg border border-border bg-surface/50">
                <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-xs">
                  <span className="flex items-center gap-2 text-muted-foreground">
                    <FileText className="size-3.5" /> {sources.length} sources
                  </span>
                  <ChevronDown className="size-3.5 text-muted-foreground" />
                </CollapsibleTrigger>
                <CollapsibleContent>
                  <div className="divide-y divide-border border-t border-border">
                    {sources.map((s) => (
                      <div key={s.title} className="px-3 py-2.5 text-xs">
                        <div className="flex items-center justify-between">
                          <span className="font-medium">{s.title}</span>
                          <span className="text-muted-foreground">{s.page}</span>
                        </div>
                        <p className="mt-1 line-clamp-2 text-muted-foreground">
                          "{s.snippet}"
                        </p>
                      </div>
                    ))}
                  </div>
                </CollapsibleContent>
              </Collapsible>

              <div className="mt-3 flex gap-1">
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                  <Copy className="size-3" /> Copy
                </Button>
                <Button variant="ghost" size="sm" className="h-7 text-xs text-muted-foreground">
                  <RefreshCw className="size-3" /> Regenerate
                </Button>
              </div>
            </Message>

            {/* Suggested */}
            <div>
              <div className="mb-2 text-xs text-muted-foreground">Suggested follow-ups</div>
              <div className="flex flex-wrap gap-2">
                {suggested.map((s) => (
                  <button
                    key={s}
                    className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-background/50 px-4 py-3 md:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-surface p-2 focus-within:border-ring">
              <Button variant="ghost" size="icon" className="size-8 shrink-0 text-muted-foreground">
                <Sparkles className="size-4" />
              </Button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your knowledge base…"
                rows={1}
                className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button size="icon" className="size-8 shrink-0">
                <Send className="size-4" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                Using <span className="text-foreground">GPT-4o</span> · 6 sources retrieved
              </span>
              <span>Press ⌘↵ to send</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Message({ role, children }: { role: "user" | "assistant"; children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-3"
    >
      <div
        className={`grid size-7 shrink-0 place-items-center rounded-md text-[10px] font-semibold ${
          role === "user" ? "bg-muted text-foreground" : "bg-foreground text-background"
        }`}
      >
        {role === "user" ? "AM" : "AI"}
      </div>
      <div className="flex-1 space-y-3 text-sm leading-relaxed">{children}</div>
    </motion.div>
  );
}
