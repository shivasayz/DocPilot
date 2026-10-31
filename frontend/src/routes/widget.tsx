import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sparkles,
  MonitorDot,
  Wifi,
  MicVocal,
  Camera,
  Brain,
  Loader2,
  Copy,
  Check,
  Bell,
  Palette,
  MapPin,
  Power,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { ComingSoonCard } from "@/components/shared/coming-soon";
import { toast } from "sonner";
import { getToken } from "@/lib/auth";
import { getWidgetSettings, updateWidgetSettings, type WidgetSettings } from "@/lib/api";

export const Route = createFileRoute("/widget")({
  head: () => ({ meta: [{ title: "Widget Settings — DocPilot" }] }),
  component: WidgetPage,
});

type SaveState = "idle" | "loading" | "saving" | "saved" | "error";

const positionLabel: Record<WidgetSettings["position"], string> = {
  "top-left": "Top left",
  "top-right": "Top right",
  "bottom-left": "Bottom left",
  "bottom-right": "Bottom right",
};

const LAUNCH_CMD = "cd desktop && npm run dev";

function WidgetPage() {
  const [settings, setSettings] = useState<WidgetSettings | null>(null);
  const [saveState, setSaveState] = useState<SaveState>("loading");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      setSaveState("error");
      return;
    }
    let cancelled = false;
    getWidgetSettings(token)
      .then((data) => {
        if (cancelled) return;
        setSettings(data);
        setSaveState("idle");
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSaveState("error");
        toast.error("Could not load widget settings", {
          description: err instanceof Error ? err.message : "Request failed",
        });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const save = async (patch: Partial<WidgetSettings>) => {
    const token = getToken();
    if (!token || !settings) return;
    const previous = settings;
    setSettings({ ...settings, ...patch });
    setSaveState("saving");
    try {
      const saved = await updateWidgetSettings(patch, token);
      setSettings(saved);
      setSaveState("saved");
      toast.success("Widget settings saved");
    } catch (err: unknown) {
      setSettings(previous);
      setSaveState("error");
      toast.error("Could not save widget settings", {
        description: err instanceof Error ? err.message : "Request failed",
      });
    }
  };

  const copyLaunch = async () => {
    try {
      await navigator.clipboard.writeText(LAUNCH_CMD);
      setCopied(true);
      toast.success("Launch command copied");
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Could not copy command");
    }
  };

  const enabled = !!settings?.widget_enabled;
  const badgeLabel =
    saveState === "loading" ? "Loading" : saveState === "error" && !settings ? "Offline" : enabled ? "Enabled" : "Disabled";

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 md:px-8">
      <PageHeader
        title="Desktop Widget"
        description="Control the floating desktop copilot from this account."
        actions={
          <Badge variant="secondary" className="gap-1.5">
            <span
              className={`size-1.5 rounded-full ${
                saveState === "error" && !settings ? "bg-destructive" : enabled ? "bg-success" : "bg-muted-foreground"
              }`}
            />
            {badgeLabel}
          </Badge>
        }
      />

      <Card className="overflow-hidden transition-shadow hover:shadow-xl hover:shadow-black/10">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3" />
              Always on your desktop
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">Floating copilot for your desktop</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Enable the widget here, then start the desktop app. Settings are stored for your account and applied on
              start, after login, and within a couple of seconds while the desktop app is signed in.
            </p>
            <div className="mt-5 flex flex-col gap-2">
              <code className="rounded-md border border-border bg-muted/40 px-3 py-2 text-xs">{LAUNCH_CMD}</code>
              <div>
                <Button type="button" size="sm" variant="outline" onClick={() => void copyLaunch()}>
                  {copied ? <Check className="size-4" /> : <Copy className="size-4" />}
                  {copied ? "Copied" : "Copy launch command"}
                </Button>
              </div>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3 text-xs sm:grid-cols-3">
              <Stat icon={Power} label="Widget" value={settings ? (enabled ? "Online" : "Off") : "—"} />
              <Stat icon={Wifi} label="Sync" value={settings?.auto_sync ? "Live" : "On open"} />
              <Stat icon={MonitorDot} label="Startup" value={settings?.auto_start ? "With OS" : "Manual"} />
              <Stat icon={Bell} label="Alerts" value={settings?.notifications_enabled ? "On" : "Off"} />
              <Stat icon={Palette} label="Theme" value={settings?.theme ?? "—"} />
            </div>
          </div>

          <div className="relative grid place-items-center border-t border-border bg-sidebar/30 p-8 grid-bg lg:border-l lg:border-t-0">
            {enabled ? (
              <div
                className={`w-72 rounded-xl border border-border shadow-2xl ${
                  settings?.theme === "light" ? "bg-white text-neutral-900" : "bg-popover"
                }`}
              >
                <div className="flex items-center justify-between border-b border-border px-3 py-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Sparkles className="size-3 text-accent" /> DocPilot
                  </div>
                  <span className="text-[10px] text-muted-foreground">Ask</span>
                </div>
                <div className="p-3">
                  <input
                    className="h-8 w-full rounded-md border border-border bg-surface/60 px-2 text-xs outline-none"
                    placeholder="Ask anything…"
                    readOnly
                  />
                  <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                    <Row>Summarize this page</Row>
                    <Row>Save as note</Row>
                    <Row>Find related in my library</Row>
                  </div>
                  <p className="mt-2 inline-flex items-center gap-1 text-[10px] text-muted-foreground">
                    <MapPin className="size-3" />
                    {settings ? positionLabel[settings.position] : "Loading position…"}
                  </p>
                </div>
              </div>
            ) : (
              <div className="w-72 rounded-xl border border-dashed border-border bg-surface/30 p-6 text-center">
                <Power className="mx-auto size-5 text-muted-foreground" />
                <p className="mt-3 text-sm font-medium">Widget is off</p>
                <p className="mt-1 text-xs text-muted-foreground">
                  Turn Enable widget back on to show it on your desktop.
                </p>
              </div>
            )}
          </div>
        </div>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-base">Configuration</CardTitle>
          {saveState === "saving" && (
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <Loader2 className="size-3 animate-spin" /> Saving
            </span>
          )}
          {saveState === "saved" && <span className="text-xs text-muted-foreground">Saved</span>}
          {saveState === "error" && settings && (
            <span className="text-xs text-destructive">Could not save. Try again.</span>
          )}
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {saveState === "loading" && (
            <p className="text-sm text-muted-foreground md:col-span-2">Loading your widget settings…</p>
          )}
          {saveState === "error" && !settings && (
            <p className="text-sm text-destructive md:col-span-2">
              Sign in and reload this page to manage widget settings.
            </p>
          )}
          {settings && (
            <>
              <RowItem label="Enable widget" hint="Show or hide the floating desktop button">
                <Switch
                  checked={settings.widget_enabled}
                  disabled={saveState === "saving"}
                  onCheckedChange={(v) => save({ widget_enabled: v })}
                />
              </RowItem>
              <RowItem label="Launch on startup" hint="Open with the operating system (packaged app)">
                <Switch
                  checked={settings.auto_start}
                  disabled={saveState === "saving"}
                  onCheckedChange={(v) => save({ auto_start: v })}
                />
              </RowItem>
              <RowItem label="Auto-sync" hint="Desktop also pulls theme, position, and other settings while running">
                <Switch
                  checked={settings.auto_sync}
                  disabled={saveState === "saving"}
                  onCheckedChange={(v) => save({ auto_sync: v })}
                />
              </RowItem>
              <RowItem label="Notifications" hint="Desktop can show system notifications">
                <Switch
                  checked={settings.notifications_enabled}
                  disabled={saveState === "saving"}
                  onCheckedChange={(v) => save({ notifications_enabled: v })}
                />
              </RowItem>

              <div>
                <Label className="text-xs text-muted-foreground">Position</Label>
                <Select
                  value={settings.position}
                  disabled={saveState === "saving"}
                  onValueChange={(v) => save({ position: v as WidgetSettings["position"] })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="top-left">Top left</SelectItem>
                    <SelectItem value="top-right">Top right</SelectItem>
                    <SelectItem value="bottom-left">Bottom left</SelectItem>
                    <SelectItem value="bottom-right">Bottom right</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label className="text-xs text-muted-foreground">Theme</Label>
                <Select
                  value={settings.theme}
                  disabled={saveState === "saving"}
                  onValueChange={(v) => save({ theme: v as WidgetSettings["theme"] })}
                >
                  <SelectTrigger className="mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dark">Dark</SelectItem>
                    <SelectItem value="light">Light</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-sm font-medium">Widget capabilities</h2>
          <span className="text-xs text-muted-foreground">Coming soon</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ComingSoonCard
            icon={MicVocal}
            title="Voice prompts"
            description="Talk to your copilot hands-free with on-device transcription."
          />
          <ComingSoonCard
            icon={Camera}
            title="Screen context"
            description="Capture the active window and ask DocPilot to explain or summarise."
          />
          <ComingSoonCard
            icon={Brain}
            title="Inline suggestions"
            description="Lightweight completions across any text field on your desktop."
          />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface/40 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <div className="mt-1 truncate text-sm font-medium">{value}</div>
    </div>
  );
}

function Row({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-center justify-between rounded-md px-2 py-1.5 hover:bg-muted/60">
      <span>{children}</span>
      <span className="text-[10px] text-muted-foreground">↵</span>
    </div>
  );
}

function RowItem({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface/40 p-3 transition-colors hover:border-foreground/15">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
