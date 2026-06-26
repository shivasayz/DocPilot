import { createFileRoute } from "@tanstack/react-router";
import {
  LineChart as LChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  CartesianGrid,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { PageHeader } from "@/components/page-header";
import { Flame, Target, BookCheck, AlertTriangle, CalendarDays } from "lucide-react";

export const Route = createFileRoute("/tracker")({
  head: () => ({ meta: [{ title: "Learning Tracker — Copilot" }] }),
  component: TrackerPage,
});

const weekly = [
  { day: "Mon", h: 1.4 },
  { day: "Tue", h: 2.1 },
  { day: "Wed", h: 0.8 },
  { day: "Thu", h: 2.8 },
  { day: "Fri", h: 1.6 },
  { day: "Sat", h: 3.4 },
  { day: "Sun", h: 2.2 },
];

const trend = Array.from({ length: 14 }).map((_, i) => ({
  d: i,
  m: Math.round(40 + Math.sin(i / 2) * 18 + Math.random() * 12),
}));

const topics = [
  { name: "Distributed Systems", pct: 78 },
  { name: "Machine Learning", pct: 62 },
  { name: "Rust", pct: 45 },
  { name: "Postgres internals", pct: 30 },
];

const weak = [
  { name: "Consensus algorithms", level: "Needs review" },
  { name: "CUDA kernels", level: "Beginner" },
  { name: "Type theory", level: "Beginner" },
];

const tasks = [
  { t: "Finish DDIA chapter 9", due: "Today" },
  { t: "Quiz: Raft vs Paxos", due: "Tomorrow" },
  { t: "Read 'Attention Is All You Need'", due: "Fri" },
];

function TrackerPage() {
  return (
    <div className="mx-auto w-full max-w-7xl space-y-8 px-4 py-8 md:px-8">
      <PageHeader
        title="Learning Tracker"
        description="Stay on top of your goals, streaks, and weak areas."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Kpi icon={Flame} label="Current streak" value="12 days" accent="text-warning" />
        <Kpi icon={Target} label="Weekly goal" value="14.3 / 20h" />
        <Kpi icon={BookCheck} label="Courses done" value="7" />
        <Kpi icon={AlertTriangle} label="Weak topics" value="3" accent="text-destructive" />
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Daily activity</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={weekly}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="var(--muted-foreground)" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="h" fill="var(--accent)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Retention trend</CardTitle>
          </CardHeader>
          <CardContent className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LChart data={trend}>
                <Line type="monotone" dataKey="m" stroke="var(--accent)" strokeWidth={2} dot={false} />
                <XAxis hide dataKey="d" />
                <YAxis hide />
                <Tooltip
                  contentStyle={{
                    background: "var(--popover)",
                    border: "1px solid var(--border)",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
              </LChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {topics.map((t) => (
              <div key={t.name}>
                <div className="mb-1.5 flex items-center justify-between text-sm">
                  <span>{t.name}</span>
                  <span className="text-muted-foreground">{t.pct}%</span>
                </div>
                <Progress value={t.pct} className="h-1.5" />
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Weak topics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {weak.map((w) => (
              <div
                key={w.name}
                className="flex items-center justify-between rounded-md border border-border bg-surface/50 px-3 py-2"
              >
                <span className="text-sm">{w.name}</span>
                <Badge variant="outline" className="text-[10px]">{w.level}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <CalendarDays className="size-4" /> June 2026
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-7 gap-1 text-center text-[10px] text-muted-foreground">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <div key={i} className="py-1">{d}</div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => {
                const intensity = [0, 0.2, 0.45, 0.7, 1][Math.floor(Math.random() * 5)];
                const today = i === 18;
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-md ${today ? "ring-1 ring-accent" : ""}`}
                    style={{
                      background: `color-mix(in oklab, var(--accent) ${intensity * 60}%, var(--muted))`,
                    }}
                  />
                );
              })}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {tasks.map((t) => (
              <div
                key={t.t}
                className="flex items-center justify-between rounded-md border border-border bg-surface/50 px-3 py-2"
              >
                <span className="text-sm">{t.t}</span>
                <span className="text-[11px] text-muted-foreground">{t.due}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function Kpi({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  accent?: string;
}) {
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{label}</span>
          <Icon className={`size-4 ${accent ?? "text-muted-foreground"}`} />
        </div>
        <div className="mt-3 text-2xl font-semibold tracking-tight">{value}</div>
      </CardContent>
    </Card>
  );
}
