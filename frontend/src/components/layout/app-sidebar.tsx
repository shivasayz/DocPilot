import { Link, useRouterState } from "@tanstack/react-router";
import { motion, LayoutGroup } from "framer-motion";
import {
  LayoutDashboard,
  Database,
  MessagesSquare,
  NotebookPen,
  AppWindow,
  User,
  Settings,
  Sparkles,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { useState, type ElementType } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/knowledge", label: "Knowledge Sources", icon: Database },
  { to: "/chat", label: "AI Chat", icon: MessagesSquare },
  { to: "/notes", label: "Notes", icon: NotebookPen },
  { to: "/widget", label: "Widget Settings", icon: AppWindow },
];

const secondary = [
  { to: "/profile", label: "Profile", icon: User },
  { to: "/settings", label: "Settings", icon: Settings },
];

function NavItem({ to, label, icon: Icon, collapsed, active }: {
  to: string;
  label: string;
  icon: ElementType;
  collapsed: boolean;
  active: boolean;
}) {
  const link = (
    <Link
      to={to}
      className={cn(
        "group relative flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-all duration-150",
        collapsed && "justify-center px-2",
        !active && "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground hover:translate-x-0.5",
      )}
    >
      {active && (
        <motion.span
          layoutId="sidebar-indicator"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute left-0 inset-y-1.5 w-[3px] rounded-full bg-accent"
        />
      )}
      {active && (
        <motion.span
          layoutId="sidebar-bg"
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className="absolute inset-0 rounded-md bg-accent/10"
        />
      )}
      <Icon className={cn("relative size-4 shrink-0", active ? "opacity-100" : "opacity-80")} />
      {!collapsed && <span className="relative truncate">{active ? <span className="text-sidebar-accent-foreground">{label}</span> : label}</span>}
    </Link>
  );

  if (collapsed) {
    return (
      <Tooltip>
        <TooltipTrigger asChild>{link}</TooltipTrigger>
        <TooltipContent side="right" sideOffset={8}>{label}</TooltipContent>
      </Tooltip>
    );
  }

  return link;
}

export function AppSidebar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (to: string) => to === "/" ? pathname === "/" : pathname.startsWith(to);

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden md:flex shrink-0 flex-col border-r border-sidebar-border bg-sidebar transition-all duration-200",
          collapsed ? "w-16" : "md:w-64 lg:w-72",
        )}
      >
        <div className={cn("flex h-14 items-center gap-2 border-b border-sidebar-border", collapsed ? "justify-center px-2" : "px-5")}>
          <div className="grid size-7 place-items-center rounded-md bg-foreground text-background">
            <Sparkles className="size-4" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-semibold tracking-tight">DocPilot</span>
              <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                Ask your docs
              </span>
            </div>
          )}
        </div>

        <nav className={cn("flex-1 overflow-y-auto scrollbar-thin py-4", collapsed ? "px-2" : "px-3")}>
          <LayoutGroup>
            {!collapsed && (
              <div className="px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Workspace
              </div>
            )}
            <div className="space-y-0.5">
              {nav.map((n) => (
                <NavItem key={n.to} {...n} collapsed={collapsed} active={isActive(n.to)} />
              ))}
            </div>

            {!collapsed && (
              <div className="mt-6 px-2 pb-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
                Account
              </div>
            )}
            {collapsed && <div className="my-3 h-px bg-sidebar-border" />}
            <div className="space-y-0.5">
              {secondary.map((n) => (
                <NavItem key={n.to} {...n} collapsed={collapsed} active={isActive(n.to)} />
              ))}
            </div>
          </LayoutGroup>
        </nav>

        {!collapsed && (
          <div className="m-3 rounded-lg border border-sidebar-border bg-sidebar-accent/40 p-3">
            <div className="flex items-center gap-2 text-xs font-medium">
              <span className="relative flex size-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-60" />
                <span className="relative inline-flex size-1.5 rounded-full bg-success" />
              </span>
              Local index synced
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              1,284 chunks · Embedding model ready
            </p>
          </div>
        )}

        <div className={cn("border-t border-sidebar-border p-2", collapsed && "flex justify-center")}>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="size-8 text-sidebar-foreground hover:text-sidebar-accent-foreground"
                onClick={() => setCollapsed((c) => !c)}
              >
                {collapsed ? <PanelLeftOpen className="size-4" /> : <PanelLeftClose className="size-4" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right" sideOffset={8}>
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </TooltipContent>
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}
