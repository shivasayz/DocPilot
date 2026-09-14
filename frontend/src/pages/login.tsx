import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "./auth-layout";

const loginMessages = [
  "Verifying credentials…",
  "Securing your session…",
  "Loading your workspace…",
];

export function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  useEffect(() => {
    if (sessionStorage.getItem("copilot.session.expired") === "1") {
      sessionStorage.removeItem("copilot.session.expired");
      toast.error("Session expired");
    }
  }, []);

  const validate = () => {
    const e: typeof errors = {};
    if (!email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setLoading(true);
    setLoadingMsg(0);

    const showMessages = async () => {
      for (let i = 1; i < loginMessages.length; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        setLoadingMsg(i);
      }
    };

    try {
      const [user] = await Promise.all([login(email, password), showMessages()]);
      // Brief pause on final message
      await new Promise((r) => setTimeout(r, 1000));
      toast.success(`Welcome back, ${user.name.split(" ")[0]}!`);
      navigate({ to: "/" });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Something went wrong";
      toast.error("Login failed", { description: message });
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div
            key="loading"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <Loader2 className="size-8 animate-spin text-accent" />
            <motion.p
              key={loadingMsg}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-muted-foreground"
            >
              {loginMessages[loadingMsg]}
            </motion.p>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-xl font-semibold tracking-tight">Sign in</h2>
            <p className="mt-1 text-sm text-muted-foreground">Enter your credentials to continue</p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    setErrors((p) => ({ ...p, email: undefined }));
                  }}
                  aria-invalid={!!errors.email}
                />
                {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
              </div>

              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <Label htmlFor="password">Password</Label>
                  <Link to="/forgot-password" className="text-xs text-accent hover:underline">
                    Forgot password?
                  </Link>
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      setErrors((p) => ({ ...p, password: undefined }));
                    }}
                    className="pr-10"
                    aria-invalid={!!errors.password}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-destructive">{errors.password}</p>}
              </div>

              <div className="flex items-center gap-2">
                <Checkbox
                  id="remember"
                  checked={remember}
                  onCheckedChange={(v) => setRemember(v === true)}
                />
                <Label htmlFor="remember" className="text-xs text-muted-foreground cursor-pointer">
                  Remember me
                </Label>
              </div>

              <Button type="submit" className="w-full" disabled={loading}>
                Sign in
              </Button>
            </form>

            <div className="my-5 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-[11px] text-muted-foreground">or</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button variant="outline" className="w-full" type="button" disabled>
              Continue with Google
            </Button>

            <p className="mt-5 text-center text-sm text-muted-foreground">
              No account?{" "}
              <Link to="/signup" className="text-accent font-medium hover:underline">
                Sign up
              </Link>
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
