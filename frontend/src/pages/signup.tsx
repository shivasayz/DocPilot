import { useNavigate, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Eye, EyeOff, Loader2, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { AuthLayout } from "./auth-layout";

const heardFromOptions = [
  "Google Search",
  "Twitter / X",
  "YouTube",
  "Friend / Colleague",
  "Reddit",
  "Product Hunt",
  "Other",
];

const occupationOptions = [
  "Student",
  "Software Engineer",
  "Data Scientist",
  "Researcher",
  "Designer",
  "Product Manager",
  "Founder / CEO",
  "Other",
];

const useCaseOptions = [
  "Learning & Study",
  "Research",
  "Work / Productivity",
  "Personal Knowledge Base",
  "Content Creation",
  "Other",
];

const creatingMessages = [
  "Setting up your account…",
  "Preparing your workspace…",
  "Configuring your preferences…",
  "Almost there…",
  "Account created! ✓",
];

export function SignupPage() {
  const navigate = useNavigate();
  const { signup } = useAuth();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState(0);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string }>({});

  // Step 2
  const [occupation, setOccupation] = useState("");
  const [organization, setOrganization] = useState("");
  const [heardFrom, setHeardFrom] = useState("");
  const [useCase, setUseCase] = useState("");


  const validateStep1 = () => {
    const e: typeof errors = {};
    if (!name.trim()) e.name = "Name is required";
    if (!email) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) e.email = "Invalid email address";
    if (!password) e.password = "Password is required";
    else if (password.length < 6) e.password = "Must be at least 6 characters";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleNext = () => {
    if (validateStep1()) setStep(2);
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    e?.preventDefault();
    setLoading(true);
    setLoadingMsg(0);

    // Show messages progressively regardless of API speed
    const showMessages = async () => {
      for (let i = 1; i < creatingMessages.length - 1; i++) {
        await new Promise((r) => setTimeout(r, 1500));
        setLoadingMsg(i);
      }
    };

    try {
      const [result] = await Promise.all([
        signup(name, email, password, {
          occupation: occupation || undefined,
          organization: organization || undefined,
          heard_from: heardFrom || undefined,
          use_case: useCase || undefined,
        }),
        showMessages(),
      ]);

      // Show final success message
      setLoadingMsg(creatingMessages.length - 1);
      await new Promise((r) => setTimeout(r, 1500));

      toast.success(`Welcome, ${name.split(" ")[0]}!`, { description: "Your workspace is ready." });
      navigate({ to: "/" });
    } catch (err: any) {
      toast.error("Signup failed", { description: err.message });
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
            {loadingMsg < creatingMessages.length - 1 ? (
              <Loader2 className="size-8 animate-spin text-accent" />
            ) : (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="grid size-12 place-items-center rounded-full bg-accent/15"
              >
                <Check className="size-6 text-accent" />
              </motion.div>
            )}
            <motion.p
              key={loadingMsg}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 text-sm text-muted-foreground"
            >
              {creatingMessages[loadingMsg]}
            </motion.p>
            {/* Progress dots */}
            <div className="mt-6 flex gap-1.5">
              {creatingMessages.map((_, i) => (
                <div
                  key={i}
                  className={`size-1.5 rounded-full transition-colors duration-300 ${
                    i <= loadingMsg ? "bg-accent" : "bg-muted"
                  }`}
                />
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <h2 className="text-xl font-semibold tracking-tight">
              {step === 1 ? "Create account" : "Tell us about yourself"}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {step === 1
                ? "Start building your personal knowledge base"
                : "Help us personalize your experience"}
            </p>

            {/* Step indicator */}
            <div className="mt-4 flex items-center gap-2">
              <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 1 ? "bg-accent" : "bg-muted"}`} />
              <div className={`h-1 flex-1 rounded-full transition-all duration-300 ${step >= 2 ? "bg-accent" : "bg-muted"}`} />
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.form
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={(e) => { e.preventDefault(); handleNext(); }}
                  className="mt-6 space-y-4"
                >
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full name</Label>
                  <Input
                    id="name"
                    placeholder="Alex Morgan"
                    value={name}
                    onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                    aria-invalid={!!errors.name}
                  />
                  {errors.name && <p className="text-xs text-destructive">{errors.name}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setErrors((p) => ({ ...p, email: undefined })); }}
                    aria-invalid={!!errors.email}
                  />
                  {errors.email && <p className="text-xs text-destructive">{errors.email}</p>}
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setErrors((p) => ({ ...p, password: undefined })); }}
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
                  <p className="text-[11px] text-muted-foreground">Minimum 6 characters</p>
                </div>

                <Button type="submit" className="w-full">
                  Continue <ArrowRight className="size-4" />
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  Already have an account?{" "}
                  <Link to="/login" className="text-accent font-medium hover:underline">Sign in</Link>
                </p>
              </motion.form>
              )}

              {step === 2 && (
                <motion.form
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  transition={{ duration: 0.3 }}
                  onSubmit={handleSubmit}
                  className="mt-6 space-y-4"
                >
                <div className="space-y-1.5">
                  <Label>What do you do?</Label>
                  <Select value={occupation} onValueChange={setOccupation}>
                    <SelectTrigger><SelectValue placeholder="Select your role" /></SelectTrigger>
                    <SelectContent>
                      {occupationOptions.map((o) => (
                        <SelectItem key={o} value={o}>{o}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="org">Organization</Label>
                  <Input
                    id="org"
                    placeholder="Company or university"
                    value={organization}
                    onChange={(e) => setOrganization(e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>How will you use Copilot?</Label>
                  <Select value={useCase} onValueChange={setUseCase}>
                    <SelectTrigger><SelectValue placeholder="Select use case" /></SelectTrigger>
                    <SelectContent>
                      {useCaseOptions.map((u) => (
                        <SelectItem key={u} value={u}>{u}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-1.5">
                  <Label>Where did you hear about us?</Label>
                  <Select value={heardFrom} onValueChange={setHeardFrom}>
                    <SelectTrigger><SelectValue placeholder="Select source" /></SelectTrigger>
                    <SelectContent>
                      {heardFromOptions.map((h) => (
                        <SelectItem key={h} value={h}>{h}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex gap-2">
                  <Button type="button" variant="outline" className="flex-1" onClick={() => setStep(1)}>
                    <ArrowLeft className="size-4" /> Back
                  </Button>
                  <Button type="submit" className="flex-1">
                    Create account
                  </Button>
                </div>

                <button
                  type="button"
                  onClick={() => handleSubmit()}
                  className="w-full text-center text-xs text-muted-foreground hover:text-foreground"
                >
                  Skip for now
                </button>
              </motion.form>
              )}
            </AnimatePresence>
          </motion.div>
        )}
      </AnimatePresence>
    </AuthLayout>
  );
}
