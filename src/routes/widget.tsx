import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Sparkles, MonitorDot, Keyboard, Wifi, MicVocal, Camera, Brain } from "lucide-react";
import { ComingSoonCard } from "@/components/coming-soon";
import { toast } from "sonner";

export const Route = createFileRoute("/widget")({
  head: () => ({ meta: [{ title: "Widget Settings — Copilot" }] }),
  component: WidgetPage,
});

const STORAGE_KEY = "copilot.widget.settings.v1";

type Settings = {
  enabled: boolean;
  startup: boolean;
  alwaysTop: boolean;
  position: "tl" | "tr" | "bl" | "br";
  theme: "match" | "dark" | "light";
  opacity: number;
};

const defaultSettings: Settings = {
  enabled: true,
  startup: true,
  alwaysTop: false,
  position: "tr",
  theme: "match",
  opacity: 92,
};

function WidgetPage() {
  const [s, setS] = useState<Settings>(defaultSettings);

  useEffect(() => {
    try {
      const v = localStorage.getItem(STORAGE_KEY);
      if (v) setS({ ...defaultSettings, ...JSON.parse(v) });
    } catch {}
  }, []);

  const patch = (p: Partial<Settings>) => {
    const next = { ...s, ...p };
    setS(next);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {}
  };

  return (
    <div className="mx-auto w-full max-w-5xl space-y-8 px-4 py-8 md:px-8">
      <PageHeader
        title="Desktop Widget"
        description="Summon your copilot from anywhere on your desktop."
        actions={
          <Badge variant="secondary" className="gap-1.5">
            <span className="size-1.5 rounded-full bg-success" /> Connected
          </Badge>
        }
      />

      {/* Hero preview */}
      <Card className="overflow-hidden transition-shadow hover:shadow-xl hover:shadow-black/10">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          <div className="p-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface/60 px-3 py-1 text-xs text-muted-foreground">
              <Sparkles className="size-3" />
              Always one hotkey away
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">
              Floating copilot for your desktop
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The desktop widget lives on top of your work. Hit your hotkey to
              ask a question, capture a thought, or pull context from your
              knowledge base.
            </p>
            <div className="mt-5 flex gap-2">
              <Button size="sm" onClick={() => toast.success("Widget launched")}>
                Launch widget
              </Button>
              <Button size="sm" variant="outline" onClick={() => toast("Download starting…")}>
                Download installer
              </Button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
              <Stat icon={MonitorDot} label="Status" value={s.enabled ? "Online" : "Off"} />
              <Stat icon={Keyboard} label="Hotkey" value="⌘ ⇧ Space" />
              <Stat icon={Wifi} label="Sync" value="Live" />
            </div>
          </div>

          <div className="relative grid place-items-center border-t border-border bg-sidebar/30 p-8 grid-bg lg:border-l lg:border-t-0">
            <div
              className="w-72 rounded-xl border border-border bg-popover shadow-2xl transition-opacity"
              style={{ opacity: s.opacity / 100 }}
            >
              <div className="flex items-center justify-between border-b border-border px-3 py-2">
                <div className="flex items-center gap-2 text-xs">
                  <Sparkles className="size-3 text-accent" /> Copilot
                </div>
                <span className="text-[10px] text-muted-foreground">⌘⇧Space</span>
              </div>
              <div className="p-3">
                <input
                  className="h-8 w-full rounded-md border border-border bg-surface/60 px-2 text-xs outline-none"
                  placeholder="Ask anything…"
                />
                <div className="mt-2 space-y-1 text-[11px] text-muted-foreground">
                  <Row>Summarize this page</Row>
                  <Row>Save as note</Row>
                  <Row>Find related in my library</Row>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Card>

      {/* Config */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <RowItem label="Enable widget" hint="Start the widget process on this device">
            <Switch checked={s.enabled} onCheckedChange={(v) => patch({ enabled: v })} />
          </RowItem>
          <RowItem label="Launch on startup" hint="Open with your system">
            <Switch checked={s.startup} onCheckedChange={(v) => patch({ startup: v })} />
          </RowItem>
          <RowItem label="Always on top" hint="Float above other windows">
            <Switch checked={s.alwaysTop} onCheckedChange={(v) => patch({ alwaysTop: v })} />
          </RowItem>
          <RowItem label="Hotkey" hint="Toggle the widget">
            <kbd className="rounded-md border border-border bg-muted px-2 py-1 text-xs">⌘ ⇧ Space</kbd>
          </RowItem>

          <div>
            <Label className="text-xs text-muted-foreground">Position</Label>
            <Select value={s.position} onValueChange={(v) => patch({ position: v as Settings["position"] })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="tl">Top left</SelectItem>
                <SelectItem value="tr">Top right</SelectItem>
                <SelectItem value="bl">Bottom left</SelectItem>
                <SelectItem value="br">Bottom right</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs text-muted-foreground">Theme</Label>
            <Select value={s.theme} onValueChange={(v) => patch({ theme: v as Settings["theme"] })}>
              <SelectTrigger className="mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="match">Match system</SelectItem>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="md:col-span-2">
            <div className="mb-1.5 flex items-center justify-between text-xs">
              <Label className="text-muted-foreground">Opacity</Label>
              <span className="text-muted-foreground tabular-nums">{s.opacity}%</span>
            </div>
            <Slider
              value={[s.opacity]}
              max={100}
              min={40}
              step={1}
              onValueChange={(arr) => patch({ opacity: arr[0] })}
            />
          </div>
        </CardContent>
      </Card>

      <div>
        <div className="mb-3 flex items-baseline gap-2">
          <h2 className="text-sm font-medium">Widget capabilities</h2>
          <span className="text-xs text-muted-foreground">Coming soon</span>
        </div>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <ComingSoonCard icon={MicVocal} title="Voice prompts" description="Talk to your copilot hands-free with on-device transcription." />
          <ComingSoonCard icon={Camera} title="Screen context" description="Capture the active window and ask Copilot to explain or summarise." />
          <ComingSoonCard icon={Brain} title="Inline suggestions" description="Lightweight completions across any text field on your desktop." />
        </div>
      </div>
    </div>
  );
}

function Stat({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <div className="rounded-md border border-border bg-surface/40 p-3">
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <Icon className="size-3" /> {label}
      </div>
      <div className="mt-1 text-sm font-medium">{value}</div>
    </div>
  );
}

function Row({ children }: { children: React.ReactNode }) {
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
  children: React.ReactNode;
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
