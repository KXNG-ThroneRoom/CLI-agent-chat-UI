"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, ChevronDown, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

type Agent = { id: string; name: string; tag: string };

const AGENTS: Agent[] = [
  { id: "hermes", name: "Hermes", tag: "Default" },
  { id: "gemma-4-e4b", name: "Gemma 4 E4B", tag: "Local" },
];

export function AgentSelector({
  value,
  onChange,
}: {
  value: string;
  onChange: (id: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const current = AGENTS.find((a) => a.id === value) ?? AGENTS[0];

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "glass group flex w-full items-center gap-2.5 rounded-xl px-3 py-2.5 text-left transition",
          "hover:border-violet/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.2)]",
        )}
      >
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet to-cyan shadow-[0_0_18px_rgba(99,102,241,0.55)]">
          <Sparkles size={15} className="text-white" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-sm font-medium text-foreground truncate">
            {current.name}
          </div>
          <div className="text-[10px] uppercase tracking-wider text-muted-foreground/80">
            {current.tag}
          </div>
        </div>
        <ChevronDown
          size={14}
          className={cn(
            "text-muted-foreground transition-transform",
            open && "rotate-180",
          )}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -4 }}
            transition={{ duration: 0.15 }}
            className="glass-strong absolute left-0 right-0 top-full z-30 mt-1 rounded-xl p-1 shadow-2xl"
          >
            {AGENTS.map((a) => (
              <button
                key={a.id}
                onClick={() => {
                  onChange(a.id);
                  setOpen(false);
                }}
                className={cn(
                  "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left text-sm transition",
                  a.id === value
                    ? "bg-violet/15 text-white"
                    : "hover:bg-white/[0.04] text-foreground/85",
                )}
              >
                <span className="flex-1">{a.name}</span>
                <span className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                  {a.tag}
                </span>
                {a.id === value && (
                  <Check size={12} className="text-cyan" />
                )}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
