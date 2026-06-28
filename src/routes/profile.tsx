import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";
import { toast } from "sonner";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Copilot" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const [form, setForm] = useState({
    full: "Alex Morgan",
    display: "alex",
    email: "alex@copilot.dev",
    tz: "Europe/London",
    goal: "2 hours",
    topics: "AI, Distributed systems, Rust",
  });

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 md:px-8">
      <PageHeader title="Profile" description="Your account and learning identity." />

      <Card>
        <CardContent className="flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center">
          <Avatar className="size-20">
            <AvatarFallback className="bg-accent text-accent-foreground text-xl">AM</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-semibold tracking-tight">{form.full}</h2>
            <p className="text-sm text-muted-foreground">{form.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">Pro plan</Badge>
              <Badge variant="outline">Member since 2024</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm" onClick={() => toast("Avatar picker coming soon")}>
            Change avatar
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" value={form.full} onChange={(v) => setForm({ ...form, full: v })} />
          <Field label="Display name" value={form.display} onChange={(v) => setForm({ ...form, display: v })} />
          <Field label="Email" value={form.email} onChange={(v) => setForm({ ...form, email: v })} />
          <Field label="Timezone" value={form.tz} onChange={(v) => setForm({ ...form, tz: v })} />
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button variant="ghost" onClick={() => toast("Changes discarded")}>Cancel</Button>
            <Button onClick={() => toast.success("Profile saved")}>Save changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Learning preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Daily goal" value={form.goal} onChange={(v) => setForm({ ...form, goal: v })} />
          <Field label="Preferred topics" value={form.topics} onChange={(v) => setForm({ ...form, topics: v })} />
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1.5" />
    </div>
  );
}
