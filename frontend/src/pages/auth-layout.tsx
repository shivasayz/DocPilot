import { motion } from "framer-motion";
import { Sparkles, Brain, Zap, BookOpen } from "lucide-react";
import type { ReactNode } from "react";

export function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background p-4">
      {/* Mesh gradient background */}
      <div className="pointer-events-none absolute inset-0">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/3" />

        {/* Large ambient orbs */}
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-20 -left-20 size-[500px] rounded-full bg-accent/8 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 18, repeat: Infinity, ease: "easeInOut", delay: 5 }}
          className="absolute -bottom-32 -right-20 size-[450px] rounded-full bg-accent/6 blur-[100px]"
        />
        <motion.div
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut", delay: 8 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[600px] rounded-full bg-accent/4 blur-[120px]"
        />

        {/* Rotating orbital rings */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[700px] rounded-full border border-foreground/[0.03]"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 100, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[900px] rounded-full border border-foreground/[0.02]"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 140, repeat: Infinity, ease: "linear" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[1100px] rounded-full border border-dashed border-foreground/[0.02]"
        />

        {/* Floating particles */}
        {[
          { top: "12%", left: "8%", size: "size-2", delay: 0, dur: 7 },
          { top: "20%", left: "85%", size: "size-1.5", delay: 1, dur: 9 },
          { top: "75%", left: "12%", size: "size-1.5", delay: 2, dur: 8 },
          { top: "80%", left: "80%", size: "size-2", delay: 0.5, dur: 6 },
          { top: "45%", left: "5%", size: "size-1", delay: 3, dur: 10 },
          { top: "30%", left: "92%", size: "size-1", delay: 4, dur: 7 },
          { top: "60%", left: "90%", size: "size-1.5", delay: 1.5, dur: 9 },
          { top: "8%", left: "50%", size: "size-1", delay: 2.5, dur: 8 },
          { top: "90%", left: "45%", size: "size-1.5", delay: 3.5, dur: 11 },
        ].map((p, i) => (
          <motion.div
            key={i}
            animate={{ y: [0, -20, 0], opacity: [0.3, 0.7, 0.3] }}
            transition={{ duration: p.dur, repeat: Infinity, ease: "easeInOut", delay: p.delay }}
            className={`absolute ${p.size} rounded-full bg-accent/40`}
            style={{ top: p.top, left: p.left }}
          />
        ))}

        {/* Grid pattern overlay */}
        <div className="absolute inset-0 grid-bg opacity-[0.03]" />
      </div>

      {/* Hypnotic concentric circles behind card */}
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-[5]">
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              rotate: i % 2 === 0 ? 360 : -360,
            }}
            transition={{
              rotate: { duration: 40 + i * 12, repeat: Infinity, ease: "linear" },
            }}
            className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              width: `${200 + i * 100}px`,
              height: `${200 + i * 100}px`,
              border: i % 3 === 0
                ? `2px dashed color-mix(in oklab, var(--accent) ${30 - i * 1.5}%, transparent)`
                : `1.5px solid color-mix(in oklab, var(--accent) ${25 - i}%, transparent)`,
            }}
          />
        ))}
        {/* Glowing ring accent */}
        <motion.div
          animate={{ scale: [1, 1.03, 1] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[500px] rounded-full border-2 border-accent/25 shadow-[0_0_40px_-5px] shadow-accent/20"
        />
        <motion.div
          animate={{ scale: [1, 1.02, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 size-[700px] rounded-full border-2 border-accent/15 shadow-[0_0_60px_-5px] shadow-accent/10"
        />
      </div>

      {/* Card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="relative z-10 flex w-full max-w-[920px] overflow-hidden rounded-2xl border border-border/60 bg-card/95 shadow-2xl shadow-black/10 backdrop-blur-sm"
      >
        {/* Left branding panel */}
        <div className="hidden lg:flex lg:w-[400px] relative overflow-hidden bg-gradient-to-b from-accent/8 via-transparent to-accent/5 border-r border-border/60">
          <div className="grid-bg pointer-events-none absolute inset-0 opacity-[0.04]" />
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
            className="absolute top-1/3 left-1/3 size-56 rounded-full bg-accent/8 blur-3xl"
          />

          <div className="relative z-10 flex flex-col justify-between p-8">
            <div className="flex items-center gap-2.5">
              <div className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground shadow-md shadow-accent/20">
                <Sparkles className="size-4" />
              </div>
              <span className="text-base font-semibold tracking-tight">Copilot</span>
            </div>

            <div>
              <h1 className="text-2xl font-bold tracking-tight leading-tight">
                Your knowledge,
                <br />
                <span className="text-accent">supercharged.</span>
              </h1>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed max-w-xs">
                Ingest documents, ask AI questions grounded in your library, and learn faster than ever.
              </p>

              <div className="mt-6 space-y-2">
                {[
                  { icon: Brain, text: "AI-powered retrieval from your docs" },
                  { icon: Zap, text: "Instant answers with source citations" },
                  { icon: BookOpen, text: "Knowledge base that grows with you" },
                ].map((f, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 + i * 0.1 }}
                    className="flex items-center gap-3 rounded-lg border border-border/40 bg-background/50 px-3 py-2.5"
                  >
                    <f.icon className="size-4 text-accent shrink-0" />
                    <span className="text-xs text-muted-foreground">{f.text}</span>
                  </motion.div>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-muted-foreground">
              © 2024 Copilot · Terms · Privacy
            </p>
          </div>
        </div>

        {/* Right content panel */}
        <div className="flex flex-1 items-center justify-center px-8 py-10">
          <div className="w-full max-w-sm">
            {/* Mobile logo */}
            <div className="mb-6 flex items-center gap-2.5 lg:hidden">
              <div className="grid size-9 place-items-center rounded-lg bg-accent text-accent-foreground shadow-md shadow-accent/20">
                <Sparkles className="size-4" />
              </div>
              <span className="text-base font-semibold tracking-tight">Copilot</span>
            </div>

            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, ease: "easeOut", delay: 0.2 }}
            >
              {children}
            </motion.div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
