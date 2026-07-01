import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/shared/page-header";
import { LogOut, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAuth, getToken } from "@/lib/auth";
import { api } from "@/lib/api";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "Profile — Copilot" }] }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    occupation: "",
    organization: "",
    use_case: "",
  });

  // Fetch full profile from backend
  useEffect(() => {
    const token = getToken();
    if (!token) return;
    api<any>("/auth/me", { token }).then((data) => {
      setForm({
        name: data.name ?? "",
        email: data.email ?? "",
        occupation: data.occupation ?? "",
        organization: data.organization ?? "",
        use_case: data.use_case ?? "",
      });
    }).catch(() => {});
  }, []);

  const initials = user?.avatar ?? (form.name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2) || "?");

  const handleSignOut = () => {
    logout();
    toast.success("Signed out");
    navigate({ to: "/login" });
  };

  const handleSave = async () => {
    const token = getToken();
    if (!token) return;
    setSaving(true);
    try {
      await api("/auth/me", {
        method: "PATCH",
        token,
        body: {
          name: form.name || undefined,
          occupation: form.occupation || undefined,
          organization: form.organization || undefined,
          use_case: form.use_case || undefined,
        },
      });
      toast.success("Profile saved");
    } catch (err: any) {
      toast.error("Failed to save", { description: err.message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-4xl space-y-8 px-4 py-8 md:px-8">
      <PageHeader
        title="Profile"
        description="Your account and learning identity."
        actions={
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="size-4" /> Sign out
          </Button>
        }
      />

      <Card>
        <CardContent className="flex flex-col items-start gap-6 p-6 sm:flex-row sm:items-center">
          <Avatar className="size-20">
            <AvatarFallback className="bg-accent text-accent-foreground text-xl">{initials}</AvatarFallback>
          </Avatar>
          <div className="flex-1">
            <h2 className="text-xl font-semibold tracking-tight">{form.name || "User"}</h2>
            <p className="text-sm text-muted-foreground">{form.email}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {form.occupation && <Badge variant="secondary">{form.occupation}</Badge>}
              {form.organization && <Badge variant="outline">{form.organization}</Badge>}
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Personal info</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} />
          <Field label="Email" value={form.email} disabled />
          <Field label="Occupation" value={form.occupation} onChange={(v) => setForm({ ...form, occupation: v })} placeholder="e.g. Software Engineer" />
          <Field label="Organization" value={form.organization} onChange={(v) => setForm({ ...form, organization: v })} placeholder="Company or university" />
          <div className="sm:col-span-2">
            <Field label="Primary use case" value={form.use_case} onChange={(v) => setForm({ ...form, use_case: v })} placeholder="e.g. Learning & Study" />
          </div>
          <div className="sm:col-span-2 flex justify-end gap-2">
            <Button onClick={handleSave} disabled={saving}>
              {saving && <Loader2 className="size-4 animate-spin" />}
              {saving ? "Saving…" : "Save changes"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-destructive/30">
        <CardContent className="flex items-center justify-between p-6">
          <div>
            <h3 className="text-sm font-medium text-destructive">Sign out of all devices</h3>
            <p className="text-xs text-muted-foreground">This will end all active sessions.</p>
          </div>
          <Button variant="outline" size="sm" className="border-destructive/40 text-destructive" onClick={handleSignOut}>
            Sign out everywhere
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

function Field({ label, value, onChange, disabled, placeholder }: {
  label: string;
  value: string;
  onChange?: (v: string) => void;
  disabled?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Input
        value={value}
        onChange={onChange ? (e) => onChange(e.target.value) : undefined}
        disabled={disabled}
        placeholder={placeholder}
        className="mt-1.5"
      />
    </div>
  );
}
