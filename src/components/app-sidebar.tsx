import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Database,
  MessagesSquare,
  NotebookPen,
  LineChart,
  AppWindow,
  User,
  Settings,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/knowledge", label: "Knowledge Sources", icon: Database },
  { to: "/chat", label: "AI Chat", icon: MessagesSquare },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/tracker", label: "Learning Tracker", icon: LineChart },
  { to: "/widget", label: "Widget Settings", icon: AppWindow },
];

const secondary = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const Item = ({ to, label, icon: Icon }: (typeof nav)[number]) => {
    const active = to === "/" ? pathname === "/" : pathname.startsWith(to);
    return (
      <Link
        to={to}
        className={cn(
          "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
          active
            ? "bg-sidebar-accent text-sidebar-accent-foreground"
            : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground",
        )}
      >
        {active && (
          <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 rounded-r bg-accent" />
        )}
        <Icon className="size-4 shrink-0 opacity-80" />
        <span className="truncate">{label}</span>
      </Link>
    );
  };

  return (
    <aside className="hidden md:flex md:w-64 lg:w-72 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
      <div className="flex h-14 items-center gap-2 px-5 border-b border-sidebar-border">
        <div className="grid size-7 place-items-center rounded-md bg-foreground text-background">
          <Sparkles className="size-4" />
        </div>
        <div className="flex flex-col leading-tight">
          <span className="text-sm font-semibold tracking-tight">Copilot</span>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Personal Learning
          </span>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4">
        <div className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Workspace
        </div>
        <div className="space-y-0.5">
          {nav.map((n) => (
            <Item key={n.to} {...n} />
          ))}
        </div>

        <div className="mt-6 px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
          Account
        </div>
        <div className="space-y-0.5">
          {secondary.map((n) => (
            <Item key={n.to} {...n} />
          ))}
        </div>
      </nav>

      <div className="m-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span className="size-1.5 rounded-full bg-success" />
          Local index synced
        </div>
        <p className="mt-1 text-[11px] text-muted-foreground">
          1,284 chunks · Embedding model ready
        </p>
      </div>
    </aside>
  );
}
