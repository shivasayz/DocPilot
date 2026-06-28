import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, ArrowLeft, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { AuthLayout } from "./auth-layout";

export function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) { setError("Email is required"); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError("Invalid email address"); return; }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSent(true);
      toast.success("Reset link sent!");
    }, 1000);
  };

  if (sent) {
    return (
      <AuthLayout>
        <div className="text-center">
          <div className="mx-auto mb-4 grid size-12 place-items-center rounded-full bg-accent/15 text-accent">
            <Mail className="size-5" />
          </div>
          <h2 className="text-xl font-semibold tracking-tight">Check your email</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            We sent a password reset link to
          </p>
          <p className="mt-1 text-sm font-medium">{email}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Didn't receive it? Check spam or{" "}
            <button onClick={() => setSent(false)} className="text-accent hover:underline">try again</button>
          </p>
          <Link to="/login" className="mt-6 inline-flex items-center gap-1.5 text-sm text-accent hover:underline">
            <ArrowLeft className="size-3.5" /> Back to sign in
          </Link>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout>
      <Link to="/login" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="size-3.5" /> Back to sign in
      </Link>

      <h2 className="text-xl font-semibold tracking-tight">Reset password</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Enter your email and we'll send you a reset link
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => { setEmail(e.target.value); setError(""); }}
            aria-invalid={!!error}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>

        <Button type="submit" className="w-full" disabled={loading}>
          {loading && <Loader2 className="size-4 animate-spin" />}
          {loading ? "Sending…" : "Send reset link"}
        </Button>
      </form>
    </AuthLayout>
  );
}
