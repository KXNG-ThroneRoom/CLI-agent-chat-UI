"use client";

import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Brain,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Cpu,
  History,
  Zap,
  type LucideIcon,
} from "lucide-react";
import type {
  ActiveProcess,
  CronJob,
  MemoryFact,
  SessionSummary,
  ToolCall,
} from "@/lib/types";
import { cn, relativeTime } from "@/lib/utils";
import { getToolMeta } from "@/lib/tools";

type Tab = "memory" | "processes" | "crons" | "sessions" | "activity";

type Props = {
  activity: ToolCall[];
  onLoadSession: (id: string) => void;
};

export function RightSidebar({ activity, onLoadSession }: Props) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("hermes:right-sidebar") !== "closed";
  });
  const [tab, setTab] = useState<Tab>("memory");
  const [memory, setMemory] = useState<MemoryFact[]>([]);
  const [processes, setProcesses] = useState<ActiveProcess[]>([]);
  const [crons, setCrons] = useState<CronJob[]>([]);
  const [sessions, setSessions] = useState<SessionSummary[]>([]);

  useEffect(() => {
    fetch("/api/memory")
      .then((r) => r.json())
      .then((d) => setMemory(d.facts ?? []))
      .catch(() => {});
    fetch("/api/processes")
      .then((r) => r.json())
      .then((d) => setProcesses(d.processes ?? []))
      .catch(() => {});
    fetch("/api/crons")
      .then((r) => r.json())
      .then((d) => setCrons(d.jobs ?? []))
      .catch(() => {});
    fetch("/api/sessions")
      .then((r) => r.json())
      .then((d) => setSessions(d.sessions ?? []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    localStorage.setItem("hermes:right-sidebar", open ? "open" : "closed");
  }, [open]);

  const tabs: { id: Tab; label: string; icon: LucideIcon; count?: number }[] =
    useMemo(
      () => [
        { id: "memory", label: "Memory", icon: Brain, count: memory.length },
        {
          id: "processes",
          label: "Processes",
          icon: Cpu,
          count: processes.filter((p) => p.status === "running").length,
        },
        {
          id: "crons",
          label: "Crons",
          icon: CalendarClock,
          count: crons.length,
        },
        {
          id: "sessions",
          label: "Sessions",
          icon: History,
          count: sessions.length,
        },
        {
          id: "activity",
          label: "Activity",
          icon: Zap,
          count: activity.length,
        },
      ],
      [memory, processes, crons, sessions, activity],
    );

  return (
    <motion.aside
      initial={{ opacity: 0, x: 12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "glass relative flex h-full shrink-0 flex-col overflow-hidden border-l border-white/[0.06] transition-[width] duration-300 ease-out",
        open ? "w-[280px]" : "w-12",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="absolute left-2 top-2 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-black/30 text-muted-foreground transition hover:border-violet/40 hover:text-foreground"
        aria-label={open ? "Collapse right sidebar" : "Expand right sidebar"}
      >
        {open ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
      </button>

      {open && (
        <>
          <div className="flex gap-1 overflow-x-auto scrollbar-thin border-b border-white/[0.06] px-2 pl-10 pt-2">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={cn(
                    "group relative flex items-center gap-1.5 rounded-t-md px-2.5 py-2 text-[11px] font-medium transition",
                    active
                      ? "text-white"
                      : "text-muted-foreground hover:text-foreground",
                  )}
                >
                  <Icon size={12} />
                  <span>{t.label}</span>
                  {typeof t.count === "number" && t.count > 0 && (
                    <span
                      className={cn(
                        "rounded-full px-1.5 py-0 text-[9px] font-mono",
                        active
                          ? "bg-violet/20 text-violet-glow"
                          : "bg-white/5 text-muted-foreground",
                      )}
                    >
                      {t.count}
                    </span>
                  )}
                  {active && (
                    <motion.span
                      layoutId="rs-tab-ind"
                      className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-violet via-cyan to-violet"
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
            <AnimatePresence mode="wait">
              <motion.div
                key={tab}
                initial={{ opacity: 0, y: 6 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -6 }}
                transition={{ duration: 0.18 }}
                className="flex flex-col gap-2"
              >
                {tab === "memory" && <MemoryList facts={memory} />}
                {tab === "processes" && <ProcessList processes={processes} />}
                {tab === "crons" && <CronList jobs={crons} />}
                {tab === "sessions" && (
                  <SessionList
                    sessions={sessions}
                    onLoad={onLoadSession}
                  />
                )}
                {tab === "activity" && <ActivityFeed activity={activity} />}
              </motion.div>
            </AnimatePresence>
          </div>
        </>
      )}
    </motion.aside>
  );
}

function MemoryList({ facts }: { facts: MemoryFact[] }) {
  if (!facts.length) return <Empty label="Nothing saved yet." />;
  return (
    <div className="flex flex-col gap-2">
      {facts.map((f) => (
        <motion.div
          key={f.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-lg border border-white/5 p-2.5"
        >
          <div className="text-xs leading-relaxed text-foreground/90">
            {f.text}
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <div className="flex flex-wrap gap-1">
              {f.tags?.map((t) => (
                <span
                  key={t}
                  className="rounded-full border border-white/10 bg-white/[0.03] px-1.5 py-0 font-mono text-[9px] text-muted-foreground"
                >
                  {t}
                </span>
              ))}
            </div>
            <span className="font-mono text-[9px] text-muted-foreground/70">
              {relativeTime(f.createdAt)}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function ProcessList({ processes }: { processes: ActiveProcess[] }) {
  if (!processes.length) return <Empty label="No background processes." />;
  return (
    <div className="flex flex-col gap-2">
      {processes.map((p) => (
        <motion.div
          key={p.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-lg border border-white/5 p-2.5"
        >
          <div className="flex items-center gap-2">
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                p.status === "running"
                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399] animate-pulse"
                  : "bg-white/20",
              )}
            />
            <span className="font-mono text-[11px] text-foreground/95 truncate">
              {p.command}
            </span>
          </div>
          <div className="mt-1 flex items-center justify-between font-mono text-[9px] text-muted-foreground/70">
            <span>pid {p.pid ?? "—"}</span>
            <span>{relativeTime(p.startedAt)}</span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function CronList({ jobs }: { jobs: CronJob[] }) {
  if (!jobs.length) return <Empty label="No scheduled jobs." />;
  return (
    <div className="flex flex-col gap-2">
      {jobs.map((j) => (
        <motion.div
          key={j.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass rounded-lg border border-white/5 p-2.5"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground/95 truncate">
              {j.name}
            </span>
            <span className="rounded-md border border-white/10 bg-white/[0.03] px-1.5 py-0.5 font-mono text-[10px] text-cyan">
              {j.schedule}
            </span>
          </div>
          <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground/80">
            {j.command}
          </div>
          <div className="mt-1 flex items-center justify-between font-mono text-[9px] text-muted-foreground/70">
            <span>
              last: {j.lastRun ? relativeTime(j.lastRun) : "—"}
            </span>
            <span>
              next:{" "}
              {j.nextRun
                ? new Date(j.nextRun).toLocaleTimeString([], {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "—"}
            </span>
          </div>
        </motion.div>
      ))}
    </div>
  );
}

function SessionList({
  sessions,
  onLoad,
}: {
  sessions: SessionSummary[];
  onLoad: (id: string) => void;
}) {
  if (!sessions.length) return <Empty label="No prior sessions." />;
  return (
    <div className="flex flex-col gap-2">
      {sessions.map((s) => (
        <motion.button
          key={s.id}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          onClick={() => onLoad(s.id)}
          className="glass group rounded-lg border border-white/5 p-2.5 text-left transition hover:border-violet/40 hover:shadow-[0_0_18px_rgba(99,102,241,0.2)]"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-foreground/95 truncate">
              {s.title}
            </span>
            <span className="font-mono text-[9px] text-muted-foreground/70">
              {relativeTime(s.updatedAt)}
            </span>
          </div>
          <div className="mt-1 truncate text-[11px] text-muted-foreground/80">
            {s.preview}
          </div>
          <div className="mt-1 font-mono text-[9px] text-muted-foreground/60">
            {s.messageCount} msgs
          </div>
        </motion.button>
      ))}
    </div>
  );
}

function ActivityFeed({ activity }: { activity: ToolCall[] }) {
  if (!activity.length)
    return <Empty label="No tools running right now." />;
  return (
    <div className="flex flex-col gap-2">
      {activity.map((t) => {
        const meta = getToolMeta(t.name);
        return (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass relative overflow-hidden rounded-lg border border-white/5 p-2.5 tool-card-running"
          >
            <div className="flex items-center gap-2">
              <span
                className="h-1.5 w-1.5 rounded-full animate-pulse"
                style={{
                  background: meta.accent,
                  boxShadow: `0 0 8px ${meta.accent}`,
                }}
              />
              <span className="font-mono text-[11px] text-foreground/95">
                {meta.label}
              </span>
              <span className="ml-auto font-mono text-[9px] text-muted-foreground/70">
                {relativeTime(t.startedAt)}
              </span>
            </div>
            {t.argsPreview && (
              <div className="mt-1 truncate font-mono text-[10px] text-muted-foreground/80">
                {t.argsPreview}
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}

function Empty({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center py-8 text-center text-[11px] text-muted-foreground/70">
      {label}
    </div>
  );
}
