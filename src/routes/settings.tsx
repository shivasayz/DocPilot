import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PageHeader } from "@/components/page-header";
import { CheckCircle2, KeyRound, Sparkles, Cpu } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Copilot" }] }),
  component: SettingsPage,
});

function SettingsPage() {
  return (
    <div className="mx-auto w-full max-w-5xl space-y-6 px-4 py-8 md:px-8">
      <PageHeader title="Settings" description="Tune your AI providers, retrieval, and workspace." />

      <Tabs defaultValue="general" className="w-full">
        <TabsList className="bg-transparent p-0 border-b border-border rounded-none w-full justify-start h-auto gap-1">
          {[
            ["general", "General"],
            ["providers", "AI Providers"],
            ["retrieval", "Retrieval"],
            ["theme", "Theme"],
            ["notifications", "Notifications"],
            ["security", "Security"],
          ].map(([v, l]) => (
            <TabsTrigger
              key={v}
              value={v}
              className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-md text-xs"
            >
              {l}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="general" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Workspace</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Workspace name" defaultValue="Alex's Copilot" />
              <Field label="Default language" defaultValue="English" />
              <Toggle label="Telemetry" hint="Anonymous usage analytics" defaultChecked={false} />
              <Toggle label="Auto-update" hint="Keep the app current" defaultChecked />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="providers" className="mt-6 space-y-4">
          <ProviderCard
            name="OpenAI"
            desc="GPT-4o, GPT-4 Turbo, embeddings"
            models={["gpt-4o", "gpt-4-turbo", "gpt-4o-mini"]}
            status="connected"
          />
          <ProviderCard
            name="Google Gemini"
            desc="Gemini 1.5 Pro, Flash, embeddings"
            models={["gemini-1.5-pro", "gemini-1.5-flash"]}
            status="connected"
          />
          <ProviderCard
            name="Ollama"
            desc="Local models running on your machine"
            models={["llama3.1:8b", "qwen2.5:14b", "mistral:7b"]}
            status="disconnected"
            local
          />
        </TabsContent>

        <TabsContent value="retrieval" className="mt-6 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Cpu className="size-4" /> Embedding & chunking
              </CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 md:grid-cols-2">
              <div>
                <Label className="text-xs text-muted-foreground">Embedding model</Label>
                <Select defaultValue="oai-3-large">
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="oai-3-large">text-embedding-3-large</SelectItem>
                    <SelectItem value="oai-3-small">text-embedding-3-small</SelectItem>
                    <SelectItem value="bge-large">bge-large-en (local)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Vector store</Label>
                <Select defaultValue="local">
                  <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="local">Local (SQLite + HNSW)</SelectItem>
                    <SelectItem value="qdrant">Qdrant</SelectItem>
                    <SelectItem value="chroma">Chroma</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <SliderField label="Chunk size (tokens)" defaultValue={800} max={2000} step={50} />
              <SliderField label="Chunk overlap" defaultValue={150} max={500} step={10} />
              <SliderField label="Top-k results" defaultValue={8} max={20} step={1} />
              <SliderField label="MMR diversity" defaultValue={40} max={100} step={5} suffix="%" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="theme" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Appearance</CardTitle></CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {["Dark", "Light", "System"].map((t, i) => (
                <button
                  key={t}
                  className={`rounded-lg border p-4 text-left ${
                    i === 0 ? "border-accent" : "border-border hover:border-foreground/20"
                  }`}
                >
                  <div
                    className="mb-3 h-16 rounded-md"
                    style={{
                      background:
                        i === 0
                          ? "linear-gradient(135deg, oklch(0.18 0.012 260), oklch(0.26 0.014 260))"
                          : i === 1
                            ? "linear-gradient(135deg, oklch(0.98 0 0), oklch(0.93 0.005 260))"
                            : "linear-gradient(135deg, oklch(0.18 0.012 260) 50%, oklch(0.95 0.003 260) 50%)",
                    }}
                  />
                  <div className="text-sm font-medium">{t}</div>
                </button>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="mt-6">
          <Card>
            <CardHeader><CardTitle className="text-base">Notifications</CardTitle></CardHeader>
            <CardContent className="space-y-2">
              <Toggle label="Index completion" hint="When a source finishes indexing" defaultChecked />
              <Toggle label="Daily learning summary" hint="Email at 8pm" defaultChecked />
              <Toggle label="New AI model releases" hint="Provider updates" />
              <Toggle label="Sound effects" hint="Subtle UI sounds" />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security" className="mt-6 space-y-4">
          <Card>
            <CardHeader><CardTitle className="text-base">Security</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Toggle label="Two-factor authentication" hint="Authenticator app" />
              <Toggle label="Encrypt local index" hint="At rest with system keychain" defaultChecked />
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
        </TabsContent>
      </Tabs>
    </div>
  );
}

function ProviderCard({
  name,
  desc,
  models,
  status,
  local,
}: {
  name: string;
  desc: string;
  models: string[];
  status: "connected" | "disconnected";
  local?: boolean;
}) {
  const [show, setShow] = useState(false);
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="grid size-10 place-items-center rounded-lg bg-muted">
              <Sparkles className="size-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{name}</span>
                {status === "connected" ? (
                  <Badge variant="secondary" className="gap-1 text-[10px]">
                    <CheckCircle2 className="size-3 text-success" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-[10px]">Disconnected</Badge>
                )}
              </div>
              <div className="text-xs text-muted-foreground">{desc}</div>
            </div>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
          {!local && (
            <div className="md:col-span-2">
              <Label className="text-xs text-muted-foreground">API key</Label>
              <div className="mt-1.5 flex gap-2">
                <div className="relative flex-1">
                  <KeyRound className="absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    type={show ? "text" : "password"}
                    defaultValue="sk-••••••••••••••••••••••••"
                    className="pl-8 font-mono text-xs"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => setShow((s) => !s)}>
                  {show ? "Hide" : "Show"}
                </Button>
              </div>
            </div>
          )}

          <div>
            <Label className="text-xs text-muted-foreground">Model</Label>
            <Select defaultValue={models[0]}>
              <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
              <SelectContent>
                {models.map((m) => (
                  <SelectItem key={m} value={m}>{m}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <SliderField label="Temperature" defaultValue={70} max={200} step={5} suffix="" divide={100} />
          <SliderField label="Max tokens" defaultValue={2048} max={8192} step={256} />
        </div>

        <div className="mt-5 flex items-center justify-end gap-2">
          <Button variant="outline" size="sm" onClick={() => toast.success(`${name} connection OK`)}>
            Test connection
          </Button>
          <Button size="sm" onClick={() => toast.success("Settings saved")}>Save</Button>
        </div>
      </CardContent>
    </Card>
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

function Toggle({
  label,
  hint,
  defaultChecked,
}: {
  label: string;
  hint?: string;
  defaultChecked?: boolean;
}) {
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

function SliderField({
  label,
  defaultValue,
  max,
  step,
  suffix,
  divide,
}: {
  label: string;
  defaultValue: number;
  max: number;
  step: number;
  suffix?: string;
  divide?: number;
}) {
  const [v, setV] = useState(defaultValue);
  const display = divide ? (v / divide).toFixed(2) : v.toString();
  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between text-xs">
        <Label className="text-muted-foreground">{label}</Label>
        <span className="text-muted-foreground">{display}{suffix ?? ""}</span>
      </div>
      <Slider
        value={[v]}
        max={max}
        step={step}
        onValueChange={(arr) => setV(arr[0])}
      />
    </div>
  );
}
