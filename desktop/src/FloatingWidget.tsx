import { useEffect, useRef, useState } from "react";
import { askKnowledge } from "../services/chatService";
import { createNote, deleteNote, listNotes, type QuickNote } from "../services/notesService";
import type { WidgetSettings } from "../services/settingsService";
import { MarkdownMessage } from "./MarkdownMessage";
import { useDrag } from "./useDrag";

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  sources?: string[];
};

type TabKey = "ask" | "notes";

type Props = {
  open: boolean;
  position: WidgetSettings["position"];
  theme: WidgetSettings["theme"];
  authed: boolean;
  error: string | null;
  onOpen: () => void;
  onClose: () => void;
  onSignIn: (email: string, password: string) => Promise<void>;
  onSignOut: () => void;
};

export function FloatingWidget({
  open,
  position,
  theme,
  authed,
  error,
  onOpen,
  onClose,
  onSignIn,
  onSignOut,
}: Props) {
  const launcherDrag = useDrag(onOpen);
  const headerDrag = useDrag();
  const [tab, setTab] = useState<TabKey>("ask");

  return (
    <div className="stage" data-position={position} data-theme={theme}>
      {open ? (
        <section className={`panel ${authed ? "is-ready" : "is-login"}`} data-theme={theme}>
          <header className="panel-header" {...headerDrag}>
            <div className="brand">
              <span className="brand-mark" aria-hidden="true">
                <ChatIcon />
              </span>
              <span>
                <strong>DocPilot</strong>
                <small>{authed ? (tab === "ask" ? "Ask your library" : "Capture a quick note") : "Sign in to continue"}</small>
              </span>
            </div>
            <button
              className="icon-button"
              type="button"
              aria-label="Collapse widget"
              onPointerDown={(event) => event.stopPropagation()}
              onClick={onClose}
            >
              <CloseIcon />
            </button>
          </header>

          {authed ? (
            <>
              <nav className="tabs" aria-label="Widget sections">
                <button
                  type="button"
                  className={tab === "ask" ? "tab active" : "tab"}
                  onClick={() => setTab("ask")}
                >
                  <AskIcon />
                  Ask
                </button>
                <button
                  type="button"
                  className={tab === "notes" ? "tab active" : "tab"}
                  onClick={() => setTab("notes")}
                >
                  <NoteIcon />
                  Notes
                </button>
              </nav>
              {tab === "ask" ? <AskPanel onSignOut={onSignOut} /> : <NotesPanel onSignOut={onSignOut} />}
            </>
          ) : (
            <Login error={error} onSubmit={onSignIn} />
          )}
        </section>
      ) : (
        <button className="launcher" type="button" aria-label="Open chat" {...launcherDrag}>
          <ChatIcon />
        </button>
      )}
    </div>
  );
}

function AskPanel({ onSignOut }: { onSignOut: () => void }) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome",
      role: "assistant",
      text: "Hi. Ask me something from your notes and documents.",
    },
  ]);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scroller.current?.scrollTo({ top: scroller.current.scrollHeight });
  }, [messages, pending]);

  const send = async () => {
    const query = draft.trim();
    if (!query || pending) return;
    setDraft("");
    setChatError(null);
    setMessages((current) => [...current, { id: crypto.randomUUID(), role: "user", text: query }]);
    setPending(true);
    try {
      const reply = await askKnowledge(query);
      setMessages((current) => [
        ...current,
        { id: crypto.randomUUID(), role: "assistant", text: reply.answer, sources: reply.sources },
      ]);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Search failed";
      setChatError(message);
      if (message === "Session expired") onSignOut();
    } finally {
      setPending(false);
    }
  };

  return (
    <div className="panel-body">
      <div className="messages" ref={scroller}>
        {messages.map((message) => (
          <div key={message.id} className={`bubble ${message.role}`}>
            {message.role === "assistant" ? (
              <MarkdownMessage content={message.text} />
            ) : (
              <p>{message.text}</p>
            )}
            {message.sources && message.sources.length > 0 && (
              <div className="sources">
                <span>Sources</span>
                <ul>
                  {message.sources.slice(0, 4).map((source) => (
                    <li key={source}>{cleanSourceLabel(source)}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ))}
        {pending && <div className="bubble assistant pending">Thinking…</div>}
      </div>
      {chatError && <p className="chat-error">{chatError}</p>}
      <form
        className="composer"
        onSubmit={(event) => {
          event.preventDefault();
          void send();
        }}
      >
        <input
          value={draft}
          placeholder="Ask a question…"
          onChange={(event) => setDraft(event.target.value)}
          disabled={pending}
        />
        <button className="send" type="submit" aria-label="Send" disabled={pending || !draft.trim()}>
          <SendIcon />
        </button>
      </form>
    </div>
  );
}

function NotesPanel({ onSignOut }: { onSignOut: () => void }) {
  const [notes, setNotes] = useState<QuickNote[]>([]);
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await listNotes();
      setNotes(next);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not load notes";
      setError(message);
      if (message === "Session expired") onSignOut();
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void refresh();
  }, []);

  const save = async () => {
    const nextTitle = title.trim() || "Quick note";
    const nextContent = content.trim();
    if (!nextContent || saving) return;
    setSaving(true);
    setError(null);
    try {
      const created = await createNote(nextTitle, nextContent);
      setNotes((current) => [created, ...current]);
      setTitle("");
      setContent("");
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Could not save note";
      setError(message);
      if (message === "Session expired") onSignOut();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    const previous = notes;
    setNotes((current) => current.filter((note) => note.id !== id));
    try {
      await deleteNote(id);
    } catch (err: unknown) {
      setNotes(previous);
      const message = err instanceof Error ? err.message : "Could not delete note";
      setError(message);
      if (message === "Session expired") onSignOut();
    }
  };

  return (
    <div className="panel-body notes-body">
      <form
        className="note-composer"
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <input
          className="note-title"
          value={title}
          placeholder="Title"
          onChange={(event) => setTitle(event.target.value)}
          disabled={saving}
        />
        <textarea
          className="note-body"
          value={content}
          placeholder="Write a quick note…"
          rows={3}
          onChange={(event) => setContent(event.target.value)}
          disabled={saving}
        />
        <div className="note-actions">
          <span className="note-hint">{content.trim() ? `${content.trim().length} chars` : "Optional title"}</span>
          <button className="note-save" type="submit" disabled={saving || !content.trim()}>
            {saving ? "Saving…" : "Save"}
          </button>
        </div>
      </form>

      {error && <p className="chat-error">{error}</p>}

      <div className="note-list">
        <div className="note-list-head">
          <span>Recent</span>
          {!loading && <em>{notes.length}</em>}
        </div>
        {loading && <p className="note-empty">Loading notes…</p>}
        {!loading && notes.length === 0 && (
          <p className="note-empty">Nothing saved yet. Capture a thought above.</p>
        )}
        {notes.map((note) => (
          <article key={note.id} className="note-card">
            <div className="note-card-top">
              <strong>{note.title || "Untitled"}</strong>
              <button
                type="button"
                className="note-delete"
                aria-label="Delete note"
                onClick={() => void remove(note.id)}
              >
                <TrashIcon />
              </button>
            </div>
            {note.content && <p>{previewNote(note.content)}</p>}
            <small>{formatWhen(note.updated_at || note.created_at)}</small>
          </article>
        ))}
      </div>
    </div>
  );
}

function Login({
  error,
  onSubmit,
}: {
  error: string | null;
  onSubmit: (email: string, password: string) => Promise<void>;
}) {
  const emailRef = useRef<HTMLInputElement>(null);
  const passwordRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);
  const visibleError = localError || error;

  useEffect(() => {
    emailRef.current?.focus();
  }, []);

  return (
    <form
      className={`login ${visibleError ? "has-error" : ""} ${pending ? "is-pending" : ""}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (pending) return;
        const nextEmail = (emailRef.current?.value || "").trim().toLowerCase();
        const nextPassword = passwordRef.current?.value || "";
        if (!nextEmail || !nextPassword) {
          setLocalError("Email and password are required");
          return;
        }
        setPending(true);
        setLocalError(null);
        void onSubmit(nextEmail, nextPassword)
          .catch((err: unknown) => {
            setLocalError(err instanceof Error ? err.message : "Login failed");
          })
          .finally(() => setPending(false));
      }}
    >
      <div className="login-intro">
        <h2>Welcome back</h2>
        <p>Use the same account as the website.</p>
      </div>

      <label className="field">
        <span>Email</span>
        <div className="field-wrap">
          <input
            ref={emailRef}
            name="email"
            type="email"
            placeholder="you@example.com"
            autoComplete="username"
            spellCheck={false}
            disabled={pending}
            required
          />
        </div>
      </label>

      <label className="field">
        <span>Password</span>
        <div className="field-wrap">
          <input
            ref={passwordRef}
            name="password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            autoComplete="current-password"
            disabled={pending}
            required
          />
          <button
            className="field-toggle"
            type="button"
            tabIndex={-1}
            aria-label={showPassword ? "Hide password" : "Show password"}
            onClick={() => setShowPassword((value) => !value)}
          >
            {showPassword ? <EyeOffIcon /> : <EyeIcon />}
          </button>
        </div>
      </label>

      {visibleError && <p className="login-error">{visibleError}</p>}

      <button className="send wide login-submit" type="submit" disabled={pending}>
        {pending ? (
          <>
            <span className="spinner" aria-hidden="true" />
            Signing in
          </>
        ) : (
          "Sign in"
        )}
      </button>
    </form>
  );
}

function formatWhen(iso: string) {
  const value = /Z$|[+-]\d{2}:\d{2}$/.test(iso) ? iso : `${iso}Z`;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function cleanSourceLabel(source: string) {
  return source
    .replace(/^Note:\s*/i, "")
    .replace(/^.*[/\\]/, "")
    .trim() || source;
}

function previewNote(content: string) {
  return content.replace(/\s+/g, " ").trim();
}

function ChatIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true">
      <path
        fill="currentColor"
        d="M5 6.5A3.5 3.5 0 0 1 8.5 3h7A3.5 3.5 0 0 1 19 6.5v6A3.5 3.5 0 0 1 15.5 16H12l-3.6 3.2c-.7.6-1.9.1-1.9-.8V16A3.5 3.5 0 0 1 5 12.5v-6Z"
      />
    </svg>
  );
}

function AskIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M12 3a8 8 0 0 0-8 8c0 2.9 1.5 5.4 3.8 6.8V21l3.4-1.9c.6.1 1.2.2 1.8.2a8 8 0 0 0 0-16Zm-.8 4.6h1.6v1.6h-1.6V7.6Zm0 3.2h1.6V16h-1.6v-5.2Z"
      />
    </svg>
  );
}

function NoteIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        fill="currentColor"
        d="M7 3h8l4 4v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm8 1.5V8h3.5L15 4.5ZM8 11h8v1.5H8V11Zm0 3.5h8V16H8v-1.5Zm0 3.5h5V19H8v-1Z"
      />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        d="M6 6l12 12M18 6L6 18"
      />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M5 7h14M10 7V5h4v2m-7 0l.7 12h7.6L16 7"
      />
    </svg>
  );
}

function SendIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path fill="currentColor" d="M4 12.5 19 5l-6.2 14-2.2-5.6L4 12.5Z" />
    </svg>
  );
}

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
      />
      <circle cx="12" cy="12" r="2.4" fill="currentColor" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
      <path
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        d="M4 5l16 14M9.5 9.7A3.4 3.4 0 0 0 8.6 12c0 1.9 1.5 3.4 3.4 3.4.7 0 1.3-.2 1.8-.6M6.2 7.3C4.1 8.7 2.5 12 2.5 12s3.5 6 9.5 6c1.7 0 3.3-.4 4.6-1.1M10.8 6.2C11.2 6.1 11.6 6 12 6c6 0 9.5 6 9.5 6s-.6 1-1.7 2.2"
      />
    </svg>
  );
}
