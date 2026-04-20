"use client";

import { motion } from "framer-motion";
import { Plus } from "lucide-react";
import { AgentSelector } from "./agent-selector";
import { SkillsBrowser } from "./skills-browser";
import { Button } from "@/components/ui/button";

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
  return (
    <motion.aside
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="glass relative flex h-full w-[240px] shrink-0 flex-col gap-4 border-r border-white/[0.06] p-3"
    >
      <div className="flex items-center gap-2 px-1 pt-1">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br from-violet to-cyan shadow-[0_0_14px_rgba(99,102,241,0.45)]">
          <span className="text-[10px] font-bold text-white">H</span>
        </div>
        <span className="text-gradient bg-clip-text text-sm font-semibold tracking-tight">
          Hermes Console
        </span>
      </div>

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
    </motion.aside>
  );
}
