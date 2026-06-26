import { createFileRoute } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/page-header";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Copilot" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 md:px-8">
      <PageHeader title="Profile" description="Your account and learning identity." />

      <Card>
        <CardContent className="flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center">
          <Avatar className="size-20">
            <AvatarFallback className="bg-accent text-accent-foreground text-xl">AM</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-semibold tracking-tight">Alex Morgan</h2>
            <p className="text-sm text-muted-foreground">alex@copilot.dev</p>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">Pro plan</Badge>
              <Badge variant="outline">Member since 2024</Badge>
            </div>
          </div>
          <Button variant="outline" size="sm">Change avatar</Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" defaultValue="Alex Morgan" />
          <Field label="Display name" defaultValue="alex" />
          <Field label="Email" defaultValue="alex@copilot.dev" />
          <Field label="Timezone" defaultValue="Europe/London" />
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button variant="ghost">Cancel</Button>
            <Button>Save changes</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Learning preferences</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Daily goal" defaultValue="2 hours" />
          <Field label="Preferred topics" defaultValue="AI, Distributed systems, Rust" />
        </CardContent>
      </Card>
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
