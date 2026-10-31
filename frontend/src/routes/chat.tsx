import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence, LayoutGroup } from "framer-motion";
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
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { toast } from "sonner";
import { getToken, useAuth } from "@/lib/auth";
import { searchKnowledge } from "@/lib/api";
import { incrementQuestionsAsked } from "@/lib/stats";
import { MarkdownContent } from "@/components/shared/markdown-content";

export const Route = createFileRoute("/chat")({
  head: () => ({ meta: [{ title: "AI Chat — DocPilot" }] }),
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
type Thread = { id: string; title: string; when: string };

const suggested = [
  "Summarize my uploaded documents",
  "What invoices do I have?",
  "List the main topics in my knowledge base",
];

/** Split into word-ish tokens so streaming feels like ChatGPT, not char spam. */
function tokenizeForStream(text: string): string[] {
  return text.match(/\S+\s*|\n+|\s+/g) ?? [text];
}

function ChatPage() {
  const { user } = useAuth();
  const [threads, setThreads] = useState<Thread[]>([
    { id: "1", title: "New conversation", when: "now" },
  ]);
  const [activeId, setActiveId] = useState("1");
  const [messagesByThread, setMessagesByThread] = useState<Record<string, Msg[]>>({
    "1": [],
  });
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "thinking" | "streaming">("idle");
  const [lastChunks, setLastChunks] = useState(0);
  const stopRef = useRef(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastQueryRef = useRef("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = messagesByThread[activeId] ?? [];

  const setMessages = (updater: Msg[] | ((prev: Msg[]) => Msg[])) => {
    setMessagesByThread((prev) => {
      const current = prev[activeId] ?? [];
      const next = typeof updater === "function" ? updater(current) : updater;
      return { ...prev, [activeId]: next };
    });
  };

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, status]);

  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`;
  }, [input]);

  const streamText = async (aId: string, text: string) => {
    setStatus("streaming");
    const tokens = tokenizeForStream(text);
    let acc = "";
    let i = 0;

    await new Promise<void>((resolve) => {
      const tick = () => {
        if (stopRef.current || i >= tokens.length) {
          resolve();
          return;
        }
        const batch = tokens.slice(i, i + (tokens[i]?.includes("\n") ? 1 : 2 + (i % 2)));
        i += batch.length;
        acc += batch.join("");
        const snapshot = acc;
        setMessages((m) => m.map((x) => (x.id === aId ? { ...x, content: snapshot } : x)));
        requestAnimationFrame(() => {
          setTimeout(tick, 18);
        });
      };
      tick();
    });
  };

  const send = async (text?: string, opts?: { regenerate?: boolean }) => {
    const value = (text ?? input).trim();
    if (!value || status !== "idle") return;

    const token = getToken() ?? undefined;
    if (!token) {
      toast.error("Please log in to search your knowledge base");
      return;
    }

    setInput("");
    lastQueryRef.current = value;
    stopRef.current = false;
    setStatus("thinking");

    const aId = crypto.randomUUID();

    if (opts?.regenerate) {
      setMessages((m) => {
        const withoutTrailingAssistant =
          m.length && m[m.length - 1].role === "assistant" ? m.slice(0, -1) : m;
        return [
          ...withoutTrailingAssistant,
          { id: aId, role: "assistant", content: "", streaming: true },
        ];
      });
    } else {
      const userMsg: Msg = { id: crypto.randomUUID(), role: "user", content: value };
      setMessages((m) => [
        ...m,
        userMsg,
        { id: aId, role: "assistant", content: "", streaming: true },
      ]);
      setThreads((arr) =>
        arr.map((t) =>
          t.id === activeId && (t.title === "New conversation" || messages.length === 0)
            ? { ...t, title: value.slice(0, 48), when: "now" }
            : t,
        ),
      );
    }

    try {
      const result = await searchKnowledge(value, 5, token);
      if (stopRef.current) {
        setMessages((m) => m.map((x) => (x.id === aId ? { ...x, streaming: false } : x)));
        setStatus("idle");
        return;
      }

      incrementQuestionsAsked();
      setLastChunks(result.chunks_used);
      const sources: Source[] = (result.sources || []).map((title) => ({
        title,
        page: "source",
        snippet: `Retrieved for: ${result.query}`,
      }));

      await streamText(aId, result.answer || "No answer returned.");
      setMessages((m) =>
        m.map((x) =>
          x.id === aId
            ? { ...x, streaming: false, sources: sources.length ? sources : undefined }
            : x,
        ),
      );
    } catch (e: any) {
      const err = e?.message || "Search failed";
      await streamText(aId, `I couldn't answer that.\n\n${err}`);
      setMessages((m) => m.map((x) => (x.id === aId ? { ...x, streaming: false } : x)));
      toast.error("Search failed", { description: err });
    } finally {
      setStatus("idle");
    }
  };

  const stop = () => {
    stopRef.current = true;
    setStatus("idle");
    setMessages((m) => m.map((x) => (x.streaming ? { ...x, streaming: false } : x)));
  };

  const newThread = () => {
    const id = crypto.randomUUID();
    setThreads((arr) => [{ id, title: "New conversation", when: "now" }, ...arr]);
    setMessagesByThread((prev) => ({ ...prev, [id]: [] }));
    setActiveId(id);
    setLastChunks(0);
    lastQueryRef.current = "";
  };

  const switchThread = (id: string) => {
    if (id === activeId) return;
    if (status !== "idle") stop();
    setActiveId(id);
    setLastChunks(0);
    lastQueryRef.current = "";
  };

  const activeThread = threads.find((t) => t.id === activeId) ?? threads[0];
  const initials = (user?.avatar || user?.name?.slice(0, 2) || "U").toUpperCase();
  const showThinking =
    status === "thinking" &&
    messages.some((m) => m.role === "assistant" && m.streaming && !m.content);

  return (
    <div className="grid h-[calc(100vh-3.5rem)] min-h-0 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)]">
      <aside className="hidden min-h-0 border-r border-border bg-sidebar/40 lg:flex lg:flex-col">
        <div className="flex items-center justify-between px-4 py-3">
          <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Conversations
          </span>
          <Button size="icon" variant="ghost" className="size-7" onClick={newThread} title="New conversation">
            <Plus className="size-4" />
          </Button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto scrollbar-thin px-2 pb-3">
          <LayoutGroup>
            {threads.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => switchThread(t.id)}
                className={`group relative flex w-full flex-col items-start gap-0.5 rounded-md px-3 py-2 text-left transition-colors ${
                  t.id === activeId ? "text-foreground" : "text-muted-foreground hover:bg-muted/60"
                }`}
              >
                {t.id === activeId && (
                  <motion.span
                    layoutId="chat-thread-indicator"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute left-0 inset-y-1 w-[3px] rounded-full bg-accent"
                  />
                )}
                {t.id === activeId && (
                  <motion.span
                    layoutId="chat-thread-active"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    className="absolute inset-0 rounded-md bg-accent/10 ring-1 ring-accent/20"
                  />
                )}
                <span className="relative line-clamp-1 text-sm">{t.title}</span>
                <span className="relative text-[11px] text-muted-foreground">{t.when}</span>
              </button>
            ))}
          </LayoutGroup>
        </div>
        <div className="border-t border-border p-3">
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-muted-foreground"
            onClick={() => {
              const id = crypto.randomUUID();
              setThreads([{ id, title: "New conversation", when: "now" }]);
              setMessagesByThread({ [id]: [] });
              setActiveId(id);
              setLastChunks(0);
              lastQueryRef.current = "";
              toast.success("All conversations cleared");
            }}
          >
            <Trash2 className="size-3.5" /> Clear all
          </Button>
        </div>
      </aside>

      <section className="flex min-h-0 min-w-0 flex-col">
        <div className="flex shrink-0 items-center justify-between border-b border-border px-4 py-3 md:px-6">
          <div className="flex min-w-0 items-center gap-2">
            <MessagesSquare className="size-4 shrink-0 text-muted-foreground" />
            <span className="truncate text-sm font-medium">{activeThread?.title ?? "New conversation"}</span>
          </div>
          <div className="flex items-center gap-1">
            {status !== "idle" ? (
              <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={stop}>
                <Square className="size-3.5" /> Stop
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="sm"
                disabled={!lastQueryRef.current}
                onClick={() => send(lastQueryRef.current, { regenerate: true })}
              >
                <RefreshCw className="size-3.5" /> Regenerate
              </Button>
            )}
          </div>
        </div>

        <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto scrollbar-thin">
          <div className="mx-auto max-w-3xl space-y-6 px-4 py-8 md:px-6">
            {messages.length === 0 && status === "idle" && (
              <div className="grid place-items-center py-16 text-center">
                <div className="grid size-12 place-items-center rounded-xl bg-muted">
                  <Sparkles className="size-5 text-accent" />
                </div>
                <h3 className="mt-4 text-base font-medium">Ask anything about your knowledge base</h3>
                <p className="mt-1 max-w-sm text-sm text-muted-foreground">
                  Answers are grounded in your indexed documents via FAISS + Groq.
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2">
                  {suggested.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => send(s)}
                      className="rounded-full border border-border bg-surface/60 px-3 py-1.5 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <AnimatePresence initial={false}>
              {messages.map((m) => {
                if (m.role === "assistant" && m.streaming && !m.content) return null;
                return <Message key={m.id} msg={m} userInitials={initials} />;
              })}
            </AnimatePresence>

            {showThinking && (
              <div className="chat-message-enter flex items-center gap-3">
                <Avatar className="size-7">
                  <AvatarFallback className="bg-foreground text-background text-[10px] font-semibold">
                    AI
                  </AvatarFallback>
                </Avatar>
                <div className="flex items-center gap-2 rounded-full border border-border/60 bg-muted/40 px-3.5 py-2">
                  <span className="text-xs text-muted-foreground">Thinking</span>
                  <div className="flex items-center gap-1">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="size-1.5 rounded-full bg-muted-foreground"
                        animate={{ opacity: [0.25, 1, 0.25], scale: [0.9, 1.1, 0.9] }}
                        transition={{ duration: 1, repeat: Infinity, delay: i * 0.18, ease: "easeInOut" }}
                      />
                    ))}
                  </div>
                </div>
              </div>
            )}

            {status === "idle" && messages.length > 0 && (
              <div>
                <div className="mb-2 text-xs text-muted-foreground">Suggested follow-ups</div>
                <div className="flex flex-wrap gap-2">
                  {suggested.map((s) => (
                    <motion.button
                      key={s}
                      type="button"
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

        <div className="shrink-0 border-t border-border bg-background/50 px-4 py-3 md:px-6">
          <div className="mx-auto max-w-3xl">
            <div className="flex items-end gap-2 rounded-xl border border-border bg-surface p-2 transition-colors focus-within:border-ring">
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    send();
                  }
                }}
                placeholder="Ask anything about your knowledge base…"
                rows={1}
                className="max-h-40 min-h-[2.25rem] flex-1 resize-none bg-transparent px-2 py-2 text-sm outline-none placeholder:text-muted-foreground"
              />
              <Button
                size="icon"
                className="size-8 shrink-0"
                onClick={() => (status === "idle" ? send() : stop())}
                disabled={status === "idle" && !input.trim()}
              >
                {status === "idle" ? <Send className="size-4" /> : <Square className="size-4" />}
              </Button>
            </div>
            <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
              <span>
                Using <span className="text-foreground">Groq</span>
                {lastChunks > 0 ? ` · ${lastChunks} chunks retrieved` : ""}
              </span>
              <span className="hidden sm:inline">
                <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px]">Enter</kbd>{" "}
                send ·{" "}
                <kbd className="rounded border border-border bg-muted/60 px-1.5 py-0.5 text-[10px]">⇧↵</kbd>{" "}
                newline
              </span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function Message({ msg, userInitials }: { msg: Msg; userInitials: string }) {
  const isUser = msg.role === "user";
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
    >
      {!isUser && (
        <Avatar className="size-7 shrink-0">
          <AvatarFallback className="bg-foreground text-background text-[10px] font-semibold">AI</AvatarFallback>
        </Avatar>
      )}
      <div className={`flex max-w-[min(85%,42rem)] flex-col ${isUser ? "items-end" : "items-start"}`}>
        {isUser ? (
          <div className="rounded-2xl rounded-tr-md bg-primary px-4 py-2.5 text-sm text-primary-foreground">
            {msg.content}
          </div>
        ) : (
          <div className="w-full">
            <MarkdownContent content={msg.content} streaming={!!msg.streaming} />
          </div>
        )}

        {!isUser && msg.sources && msg.sources.length > 0 && !msg.streaming && (
          <Collapsible className="group mt-3 w-full rounded-lg border border-border bg-surface/50">
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
                    <div className="font-medium">{s.title}</div>
                    <p className="mt-1 line-clamp-2 text-muted-foreground">"{s.snippet}"</p>
                  </div>
                ))}
              </div>
            </CollapsibleContent>
          </Collapsible>
        )}

        {!isUser && !msg.streaming && msg.content && (
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
          <AvatarFallback className="bg-accent text-accent-foreground text-[10px] font-semibold">
            {userInitials}
          </AvatarFallback>
        </Avatar>
      )}
    </motion.div>
  );
}
