import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { motion, LayoutGroup } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { PageHeader } from "@/components/shared/page-header";
import { Settings2, Palette, Shield } from "lucide-react";
import { useTheme } from "@/lib/theme";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — DocPilot" }] }),
  component: SettingsPage,
});

const tabs = [
  { key: "general", label: "General", icon: Settings2 },
  { key: "theme", label: "Theme", icon: Palette },
  { key: "security", label: "Security", icon: Shield },
];

function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [activeTab, setActiveTab] = useState("general");

  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader title="Settings" description="Manage your workspace preferences." />

      <div className="flex gap-6">
        {/* Tab nav */}
        <nav className="hidden w-48 shrink-0 md:block">
          <LayoutGroup>
            <div className="space-y-0.5">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`relative flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors ${
                      isActive ? "text-foreground" : "text-muted-foreground hover:bg-muted/60"
                    }`}
                  >
                    {isActive && (
                      <motion.span
                        layoutId="settings-tab-indicator"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="absolute left-0 inset-y-1.5 w-[3px] rounded-full bg-accent"
                      />
                    )}
                    {isActive && (
                      <motion.span
                        layoutId="settings-tab-bg"
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="absolute inset-0 rounded-md bg-accent/10"
                      />
                    )}
                    <Icon className="relative size-4" />
                    <span className="relative">{tab.label}</span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>
        </nav>

        {/* Mobile tabs */}
        <div className="flex gap-1 md:hidden mb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                  isActive ? "bg-accent/10 text-foreground" : "text-muted-foreground"
                }`}
              >
                <Icon className="size-3.5" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          {activeTab === "general" && (
            <div className="space-y-4">
              <Card>
                <CardHeader><CardTitle className="text-base">Workspace</CardTitle></CardHeader>
                <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <Field label="Workspace name" defaultValue="My Workspace" />
                  <Field label="Default language" defaultValue="English" />
                  <div className="sm:col-span-2">
                    <Toggle label="Auto-update" hint="Keep the app current" defaultChecked />
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {activeTab === "theme" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
              <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {(["dark", "light"] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setTheme(t)}
                    className={`group rounded-xl border-2 p-5 text-left transition-all ${
                      theme === t
                        ? "border-accent bg-accent/5"
                        : "border-border hover:border-foreground/20"
                    }`}
                  >
                    <div
                      className="mb-4 h-20 rounded-lg transition-transform group-hover:scale-[1.02]"
                      style={{
                        background:
                          t === "dark"
                            ? "linear-gradient(135deg, oklch(0.18 0.012 260), oklch(0.26 0.014 260))"
                            : "linear-gradient(135deg, oklch(0.98 0 0), oklch(0.93 0.005 260))",
                      }}
                    />
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium capitalize">{t}</span>
                      {theme === t && (
                        <span className="size-2 rounded-full bg-accent" />
                      )}
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          )}

          {activeTab === "security" && (
            <Card>
              <CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <Toggle label="Two-factor authentication" hint="Authenticator app" />
                <div className="flex items-center justify-between rounded-lg border border-destructive/30 bg-destructive/5 p-3">
                  <div>
                    <div className="text-sm font-medium text-destructive">Delete workspace</div>
                    <div className="text-xs text-muted-foreground">Removes all data permanently.</div>
                  </div>
                  <Button variant="outline" size="sm" className="border-destructive/40 text-destructive">
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input defaultValue={defaultValue} className="mt-1.5" />
    </div>
  );
}

function Toggle({ label, hint, defaultChecked }: { label: string; hint?: string; defaultChecked?: boolean }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-border bg-surface/40 p-3">
      <div>
        <div className="text-sm font-medium">{label}</div>
        {hint && <div className="text-xs text-muted-foreground">{hint}</div>}
      </div>
      <Switch defaultChecked={defaultChecked} />
    </div>
  );
}
