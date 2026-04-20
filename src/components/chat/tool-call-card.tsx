"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileText,
  FilePlus,
  Search,
  GitBranch,
  TerminalSquare,
  Code2,
  Globe,
  Camera,
  MousePointerClick,
  Keyboard,
  ScrollText,
  SquareTerminal,
  Images,
  Eye,
  HelpCircle,
  Brain,
  History,
  CalendarClock,
  Cpu,
  BookOpen,
  List,
  Settings2,
  Volume2,
  Sparkles,
  ChevronDown,
  type LucideIcon,
} from "lucide-react";
import type { ToolCall } from "@/lib/types";
import { getToolMeta } from "@/lib/tools";
import { cn, formatDuration } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  FileText,
  FilePlus,
  Search,
  GitBranch,
  TerminalSquare,
  Code2,
  Globe,
  Camera,
  MousePointerClick,
  Keyboard,
  ScrollText,
  SquareTerminal,
  Images,
  Eye,
  HelpCircle,
  Brain,
  History,
  CalendarClock,
  Cpu,
  BookOpen,
  List,
  Settings2,
  Volume2,
  Sparkles,
};

export function ToolCallCard({ call }: { call: ToolCall }) {
  const [open, setOpen] = useState(false);
  const meta = getToolMeta(call.name);
  const Icon = ICONS[meta.icon] ?? Sparkles;
  const running = call.status === "running";
  const duration =
    call.endedAt && call.startedAt
      ? formatDuration(call.endedAt - call.startedAt)
      : null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={cn(
        "glass relative overflow-hidden rounded-lg border border-white/10 pl-3 pr-3 py-2 my-2 text-xs",
        running && "tool-card-running animate-pulse-border",
      )}
      style={{
        boxShadow: running
          ? `0 0 20px ${meta.accent}22, inset 0 0 1px ${meta.accent}55`
          : undefined,
      }}
    >
      <button
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-2 text-left"
      >
        <span
          className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-white/10"
          style={{
            background: `linear-gradient(135deg, ${meta.accent}22, transparent)`,
            color: meta.accent,
          }}
        >
          <Icon size={13} />
        </span>
        <span className="font-mono text-[11px] text-foreground/90">
          {meta.label}
        </span>
        {call.argsPreview && (
          <span className="font-mono text-[10px] text-muted-foreground/70 truncate max-w-[260px]">
            {call.argsPreview}
          </span>
        )}
        <span className="ml-auto flex items-center gap-2">
          {running ? (
            <span className="flex items-center gap-1 text-[10px] text-cyan">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan animate-pulse" />
              running
            </span>
          ) : call.status === "error" ? (
            <span className="text-[10px] text-rose-400">error</span>
          ) : (
            <span className="text-[10px] text-emerald-400/80">
              {duration ?? "done"}
            </span>
          )}
          {(call.output || call.argsPreview) && (
            <ChevronDown
              size={12}
              className={cn(
                "text-muted-foreground transition-transform",
                open && "rotate-180",
              )}
            />
          )}
        </span>
      </button>

      <AnimatePresence initial={false}>
        {open && (call.output || call.argsPreview) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <pre className="mt-2 max-h-60 overflow-auto scrollbar-thin rounded-md border border-white/5 bg-black/30 p-2 font-mono text-[11px] leading-relaxed text-muted-foreground whitespace-pre-wrap break-words">
              {call.output || call.argsPreview}
            </pre>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
