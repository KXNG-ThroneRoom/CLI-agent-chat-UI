"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AgentSelector } from "./agent-selector";
import { SkillsBrowser } from "./skills-browser";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Props = {
  agent: string;
  onAgentChange: (id: string) => void;
  runningSkill: string | null;
  onInsertSkill: (name: string) => void;
  onNewSession: () => void;
};

export function LeftSidebar({
  agent,
  onAgentChange,
  runningSkill,
  onInsertSkill,
  onNewSession,
}: Props) {
  const [open, setOpen] = useState(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("hermes:left-sidebar") !== "closed";
  });

  useEffect(() => {
    localStorage.setItem("hermes:left-sidebar", open ? "open" : "closed");
  }, [open]);

  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className={cn(
        "glass relative flex h-full shrink-0 flex-col gap-4 overflow-hidden border-r border-white/[0.06] transition-[width,padding] duration-300 ease-out",
        open ? "w-[240px] p-3 pt-12" : "w-12 p-2 pt-20",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "absolute right-2 z-10 flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-black/30 text-muted-foreground transition hover:border-violet/40 hover:text-foreground",
          open ? "top-2" : "top-12",
        )}
        aria-label={open ? "Collapse left sidebar" : "Expand left sidebar"}
      >
        {open ? <ChevronLeft size={14} /> : <ChevronRight size={14} />}
      </button>

      <div
        className={cn(
          "flex items-center gap-2",
          open ? "px-1 pr-8" : "justify-center px-0",
        )}
      >
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet to-cyan shadow-[0_0_14px_rgba(99,102,241,0.45)]">
          <span className="text-[10px] font-bold text-white">H</span>
        </div>
        {open && (
          <span className="text-gradient bg-clip-text text-sm font-semibold tracking-tight">
            Hermes Console
          </span>
        )}
      </div>

      {open && (
        <>
          <AgentSelector value={agent} onChange={onAgentChange} />

          <Button
            variant="outline"
            size="sm"
            onClick={onNewSession}
            className="justify-start gap-2 border-white/10"
          >
            <Plus size={13} />
            New session
          </Button>

          <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

          <div className="flex items-center justify-between px-1">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
              Skills
            </span>
          </div>

          <SkillsBrowser
            runningSkill={runningSkill}
            onInsertSkill={onInsertSkill}
          />

          <div className="mt-auto px-1 text-[10px] text-muted-foreground/60 font-mono">
            v0.1 · localhost only
          </div>
        </>
      )}
    </motion.aside>
  );
}
