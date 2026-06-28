import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Paperclip,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "AI Chat — Copilot" }] }),
  component: ChatPage,
});

type Source = { title: string; page: string; snippet: string };
type Msg = {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: Source[];
  streaming?: boolean;
};

const initialThreads = [
  { id: "1", title: "CAP theorem trade-offs", when: "2h" },
  { id: "2", title: "RAG chunk size tuning", when: "Yesterday" },
  { id: "3", title: "Comparing vector DBs", when: "Mon" },
  { id: "4", title: "Rust lifetimes refresher", when: "May 18" },
];

const suggested = [
  "Summarize my notes on retrieval augmentation",
  "What did Vaswani et al. (2017) say about attention?",
  "Quiz me on Raft consensus",
];

const seedSources: Source[] = [
  { title: "Designing Data-Intensive Apps.pdf", page: "p. 312", snippet: "In a partitioned system, the CAP theorem states…" },
  { title: "MIT 6.824 — Lecture 5.md", page: "§3", snippet: "Linearizability requires a real-time ordering…" },
];

const seed: Msg[] = [
  {
    id: "m1",
    role: "user",
    content:
      "In a distributed key-value store, how do I reason about CAP when choosing between Raft and a leaderless design?",
  },
  {
    id: "m2",
    role: "assistant",
    content:
      "The CAP theorem forces a runtime trade-off between consistency and availability when a partition occurs.\n\n• Raft (leader-based): prioritises consistency. Writes go through an elected leader; if the leader is partitioned, writes pause until a new quorum forms.\n• Leaderless (Dynamo-style): prioritises availability. Multiple replicas accept writes concurrently; conflicts resolve later with vector clocks or CRDTs.\n\nFor a read-heavy workload with strict ordering, Raft is the safer default — pair it with `read_index` for low-latency consistent reads.",
    sources: seedSources,
  },
];

function ChatPage() {
  const [threads, setThreads] = useState(initialThreads);
  const [activeId, setActiveId] = useState(threads[0].id);
  const [messages, setMessages] = useState<Msg[]>(seed);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "streaming">("idle");
  const stopRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  const send = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || status !== "idle") return;
    setInput("");
    const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: value };
    const aId = crypto.randomUUID();
    setMessages((m) => [...m, userMsg, { id: aId, role: "assistant", content: "", streaming: true }]);
    setStatus("thinking");
    stopRef.current = false;

    await new Promise((r) => setTimeout(r, 450));
    setStatus("streaming");

    const reply =
      "Based on your library, here is a concise answer.\n\nRetrieval augmented generation works best when chunk size matches the structure of your source documents. For dense technical PDFs, 800 tokens with 150 overlap consistently improves recall in evaluations.\n\nWant me to compare a few embedding models from your settings?";
    let acc = "";
    for (const ch of reply) {
      if (stopRef.current) break;
      acc += ch;
      setMessages((m) => m.map((x) => (x.id === aId ? { ...x, content: acc } : x)));
      await new Promise((r) => setTimeout(r, 14));
    }
    setMessages((m) => m.map((x) => (x.id === aId ? { ...x, streaming: false, sources: seedSources } : x)));
    setStatus("idle");
  };

  const stop = () => {
    stopRef.current = true;
    setStatus("idle");
    setMessages((m) => m.map((x) => (x.streaming ? { ...x, streaming: false } : x)));
  };

  const newThread = () => {
    const t = { id: crypto.randomUUID(), title: "New conversation", when: "now" };
    setThreads((arr) => [t, ...arr]);
    setActiveId(t.id);
    setMessages([]);
  };

  const activeThread = threads.find((t) => t.id === activeId) ?? threads[0];

  return (
    <div className="grid h-[calc(100vh-3.5rem)] grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
      {/* Threads */}
      <aside className="hidden border-r border-border bg-sidebar/40 lg:flex lg:flex-col">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Conversations
          </span>
          <Button size="icon" variant="ghost" className="size-7" onClick={newThread} title="New conversation">
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="flex-1 overflow-y-auto scrollbar-thin px-2 pb-3">
          {threads.map((t) => (
            <button
              key={t.id}
              onClick={() => setActiveId(t.id)}
              className={`group flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors ${
                t.id === activeId ? "bg-muted" : "hover:bg-muted/60"
              }`}
            >
              <span className="line-clamp-1 text-sm">{t.title}</span>
              <span className="text-[11px] text-muted-foreground">{t.when}</span>
            </button>
          ))}
        </div>
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => {
              setThreads([]);
              setMessages([]);
              toast.success("All conversations cleared");
            }}
          >
            <Trash2 className="size-3.5" /> Clear all
          </Button>
        </div>
      </aside>

      {/* Chat surface */}
      <section className="flex min-w-0 flex-col">
        <div className="flex items-center justify-between border-b border-border px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <MessagesSquare className="size-4 text-muted-foreground" />
            <span className="truncate text-sm font-medium">{activeThread?.title ?? "New conversation"}</span>
          </div>
          <div className="flex items-center gap-1">
            {status !== "idle" ? (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={stop}>
                <Square className="size-3.5" /> Stop
              </Button>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => send("Regenerate the previous answer")}>
                <RefreshCw className="size-3.5" /> Regenerate
              </Button>
            )}
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
            {messages.length === 0 && (
              <div className="grid place-items-center py-16 text-center">
                <div className="grid size-12 place-items-center rounded-xl bg-muted">
                  <Sparkles className="size-5 text-accent" />
                </div>
                <h3 className="mt-4 text-base font-medium">Ask anything about your knowledge base</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Answers cite the exact documents, notes, and pages they came from.
                </p>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((m) => (
                <Message key={m.id} msg={m} />
              ))}
            </AnimatePresence>

            {status === "thinking" && (
              <div className="flex items-center gap-3">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-foreground text-background text-[10px] font-semibold">AI</AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-1.5 rounded-full bg-muted/60 px-3 py-2">
                  {[0, 1, 2].map((i) => (
                    <motion.span
                      key={i}
                      className="size-1.5 rounded-full bg-muted-foreground"
                      animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
                      transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Suggested */}
            {status === "idle" && messages.length > 0 && (
              <div>
                <div className="mb-2 text-xs text-muted-foreground">Suggested follow-ups</div>
                <div className="flex flex-wrap gap-2">
                  {suggested.map((s) => (
                    <motion.button
                      key={s}
                      whileHover={{ y: -1 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => send(s)}
                      className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {s}
                    </motion.button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Composer */}
        <div className="border-t border-border bg-background/50 px-4 py-3 md:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-surface p-2 transition-colors focus-within:border-ring">
              <Button
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-muted-foreground"
                onClick={() => toast("Attach files coming soon")}
              >
                <Paperclip className="size-4" />
              </Button>
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask anything about your knowledge base…"
                rows={1}
                className="max-h-40 flex-1 resize-none bg-transparent px-1 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button
                size="icon"
                className="size-8 shrink-0"
                onClick={() => send()}
                disabled={!input.trim() || status !== "idle"}
              >
                <Send className="size-4" />
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                Using <span className="text-foreground">GPT-4o</span> · 6 sources retrieved
              </span>
              <span>
                <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px]">Enter</kbd> to send ·{" "}
                <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px]">⇧↵</kbd> for newline
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Message({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="bg-foreground text-background text-[10px] font-semibold">AI</AvatarFallback>
        </Avatar>
      )}
      <div className={`flex max-w-[85%] flex-col ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={
            isUser
              ? "rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm text-primary-foreground"
              : "text-sm leading-relaxed text-foreground"
          }
        >
          {msg.content.split("\n").map((line, i) => (
            <p key={i} className={i > 0 ? "mt-2" : ""}>
              {line || "\u00a0"}
              {!isUser && msg.streaming && i === msg.content.split("\n").length - 1 && (
                <span className="ml-0.5 inline-block h-3.5 w-0.5 translate-y-0.5 animate-pulse bg-foreground/70" />
              )}
            </p>
          ))}
        </div>

        {!isUser && msg.sources && (
          <Collapsible className="mt-3 w-full rounded-lg border border-border bg-surface/50">
            <CollapsibleTrigger className="flex w-full items-center justify-between px-3 py-2 text-xs">
              <span className="flex items-center gap-2 text-muted-foreground">
                <FileText className="size-3.5" /> {msg.sources.length} sources
              </span>
              <ChevronDown className="size-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
            </CollapsibleTrigger>
            <CollapsibleContent>
              <div className="divide-y divide-border border-t border-border">
                {msg.sources.map((s) => (
                  <div key={s.title} className="px-3 py-2.5 text-xs">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{s.title}</span>
                      <span className="text-muted-foreground">{s.page}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-muted-foreground">"{s.snippet}"</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {!isUser && !msg.streaming && (
          <div className="mt-2 flex gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs text-muted-foreground"
              onClick={() => {
                navigator.clipboard?.writeText(msg.content);
                toast.success("Copied to clipboard");
              }}
            >
              <Copy className="size-3" /> Copy
            </Button>
          </div>
        )}
      </div>
      {isUser && (
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="bg-accent text-accent-foreground text-[10px] font-semibold">AM</AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}
