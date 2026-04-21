"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
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
  const rawOutput = call.output || call.argsPreview || "";
  const skillView = call.name === "skill_view" ? parseSkillView(rawOutput) : null;
  const markdownOutput = skillView ? skillView.content : getToolMarkdownContent(rawOutput);
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
        {call.argsPreview && call.name !== "skill_view" && (
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
        {open && (markdownOutput || skillView) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            {skillView ? (
              <SkillViewCard skill={skillView} />
            ) : (
              <ToolOutput content={markdownOutput} />
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

type SkillView = {
  name: string;
  description: string;
  content: string;
  tools: string[];
};

function SkillViewCard({ skill }: { skill: SkillView }) {
  return (
    <div className="mt-3 rounded-xl border border-zinc-800 bg-zinc-900/70 p-4">
      <div className="text-xs text-zinc-500 mb-1">Tool Output</div>

      <div className="rounded-lg border border-cyan/15 bg-cyan/[0.03] p-3">
        <div className="min-w-0">
          <div className="font-mono text-[10px] uppercase tracking-wider text-cyan/80">
            Skill
          </div>
          <div className="mt-0.5 truncate text-sm font-semibold text-foreground">
            {skill.name || "Unnamed skill"}
          </div>
        </div>

        {skill.description && (
          <div className="mt-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Description
            </div>
            <div className="prose prose-invert mt-1 max-w-none text-[12px] leading-relaxed text-foreground/85">
              <ReactMarkdown components={markdownComponents}>
                {skill.description}
              </ReactMarkdown>
            </div>
          </div>
        )}

        <div className="mt-3">
          <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
            Tools
          </div>
          {skill.tools.length > 0 ? (
            <div className="mt-1.5 flex flex-wrap gap-1.5">
              {skill.tools.map((tool) => (
                <span
                  key={tool}
                  className="rounded-full border border-white/10 bg-white/[0.04] px-2 py-0.5 font-mono text-[10px] text-muted-foreground"
                >
                  {tool}
                </span>
              ))}
            </div>
          ) : (
            <div className="mt-1 text-[11px] text-muted-foreground/70">
              No tools listed.
            </div>
          )}
        </div>

        {skill.content && (
          <div className="mt-3">
            <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/70">
              Content
            </div>
            <ToolOutput content={skill.content} compact />
          </div>
        )}
      </div>
    </div>
  );
}

function ToolOutput({
  content,
  compact = false,
}: {
  content: string;
  compact?: boolean;
}) {
  if (!content) return null;

  return (
    <div
      className={cn(
        "overflow-auto scrollbar-thin rounded-xl border border-zinc-800 bg-zinc-900/70 p-4",
        compact ? "mt-1 max-h-48" : "mt-3 max-h-60",
      )}
    >
      {!compact && <div className="text-xs text-zinc-500 mb-1">Tool Output</div>}
      <div className="prose prose-invert max-w-none text-[12px] leading-relaxed text-foreground/85">
        <ReactMarkdown components={markdownComponents}>{content}</ReactMarkdown>
      </div>
    </div>
  );
}

const markdownComponents = {
  h1: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h1 className="mb-2 mt-3 text-base font-semibold text-foreground" {...props} />
  ),
  h2: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h2 className="mb-2 mt-3 text-sm font-semibold text-foreground" {...props} />
  ),
  h3: (props: React.HTMLAttributes<HTMLHeadingElement>) => (
    <h3 className="mb-1.5 mt-2.5 text-xs font-semibold text-foreground" {...props} />
  ),
  p: (props: React.HTMLAttributes<HTMLParagraphElement>) => (
    <p className="my-2 first:mt-0 last:mb-0" {...props} />
  ),
  ul: (props: React.HTMLAttributes<HTMLUListElement>) => (
    <ul className="my-2 list-disc space-y-1 pl-5" {...props} />
  ),
  ol: (props: React.OlHTMLAttributes<HTMLOListElement>) => (
    <ol className="my-2 list-decimal space-y-1 pl-5" {...props} />
  ),
  li: (props: React.LiHTMLAttributes<HTMLLIElement>) => (
    <li className="pl-1" {...props} />
  ),
  code: (props: React.HTMLAttributes<HTMLElement>) => (
    <code
      className="rounded border border-white/10 bg-black/35 px-1 py-0.5 font-mono text-[11px] text-cyan"
      {...props}
    />
  ),
  pre: (props: React.HTMLAttributes<HTMLPreElement>) => (
    <pre
      className="my-2 overflow-auto rounded-lg border border-white/10 bg-black/40 p-3 font-mono text-[11px] text-muted-foreground"
      {...props}
    />
  ),
};

function parseSkillView(raw: string): SkillView | null {
  if (!raw) return null;
  try {
    const parsed = parseMaybeJson(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const record = parsed as Record<string, unknown>;
    return {
      name: getString(record.name) || getString(record.skill) || getString(record.path),
      description: getString(record.description),
      content: getString(record.content),
      tools: getTools(record),
    };
  } catch {
    return null;
  }
}

function getToolMarkdownContent(raw: string): string {
  if (!raw) return "";

  try {
    const parsed = parseMaybeJson(raw);
    if (!parsed || typeof parsed !== "object") {
      return typeof parsed === "string" ? parsed : raw;
    }
    const record = parsed as Record<string, unknown>;
    return getString(record.content) || getString(record.description);
  } catch {
    return raw;
  }
}

function parseMaybeJson(value: string): unknown {
  let parsed: unknown = JSON.parse(value);
  if (typeof parsed === "string") {
    parsed = JSON.parse(parsed);
  }
  return parsed;
}

function getString(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function getTools(record: Record<string, unknown>): string[] {
  const candidates = [
    record.tools,
    record.available_tools,
    record.enabled_tools,
    record.tool_names,
    record.required_commands,
    record.linked_files,
    getNested(record.metadata, "tools"),
    getNested(record.metadata, "hermes.tools"),
  ];

  for (const candidate of candidates) {
    const tools = normalizeList(candidate);
    if (tools.length > 0) return tools;
  }

  return [];
}

function getNested(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, key) => {
    if (!current || typeof current !== "object") return undefined;
    return (current as Record<string, unknown>)[key];
  }, value);
}

function normalizeList(value: unknown): string[] {
  if (!value) return [];
  if (typeof value === "string") {
    return value
      .split(/[,\n]/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  if (!Array.isArray(value)) return [];
  return value
    .map((item) => {
      if (typeof item === "string") return item.trim();
      if (item && typeof item === "object") {
        const record = item as Record<string, unknown>;
        return (
          getString(record.name) ||
          getString(record.path) ||
          getString(record.label)
        );
      }
      return "";
    })
    .filter(Boolean);
}
