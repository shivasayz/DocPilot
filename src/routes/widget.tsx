import { createFileRoute } from "@tanstack/react-router";
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
import { Sparkles, MonitorDot, Keyboard, Wifi } from "lucide-react";

export const Route = createFileRoute("/widget")({
  head: () => ({ meta: [{ title: "Widget Settings — Copilot" }] }),
  component: WidgetPage,
});

function WidgetPage() {
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
      <Card className="overflow-hidden">
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
              <Button size="sm">Launch widget</Button>
              <Button size="sm" variant="outline">Download installer</Button>
            </div>
            <div className="mt-6 grid grid-cols-3 gap-3 text-xs">
              <Stat icon={MonitorDot} label="Status" value="Online" />
              <Stat icon={Keyboard} label="Hotkey" value="⌘ ⇧ Space" />
              <Stat icon={Wifi} label="Sync" value="Live" />
            </div>
          </div>

          <div className="relative grid place-items-center border-t border-border bg-sidebar/30 p-8 grid-bg lg:border-l lg:border-t-0">
            <div className="w-72 rounded-xl border border-border bg-popover shadow-2xl">
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
            <Switch defaultChecked />
          </RowItem>
          <RowItem label="Launch on startup" hint="Open with your system">
            <Switch defaultChecked />
          </RowItem>
          <RowItem label="Always on top" hint="Float above other windows">
            <Switch />
          </RowItem>
          <RowItem label="Hotkey" hint="Toggle the widget">
            <kbd className="rounded-md border border-border bg-muted px-2 py-1 text-xs">
              ⌘ ⇧ Space
            </kbd>
          </RowItem>

          <div>
            <Label className="text-xs text-muted-foreground">Position</Label>
            <Select defaultValue="tr">
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
            <Select defaultValue="match">
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
              <span className="text-muted-foreground">92%</span>
            </div>
            <Slider defaultValue={[92]} max={100} step={1} />
          </div>
        </CardContent>
      </Card>
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
    <div className="flex items-center justify-between gap-4 rounded-lg border border-border bg-surface/40 p-3">
      <div className="min-w-0">
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <div className="shrink-0">{children}</div>
    </div>
  );
}
