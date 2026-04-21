"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronRight, Search } from "lucide-react";
import { SKILL_CATEGORIES, type SkillCategory } from "@/lib/skills";
import { cn } from "@/lib/utils";

type Props = {
  runningSkill?: string | null;
  onInsertSkill: (name: string) => void;
};

export function SkillsBrowser({ runningSkill, onInsertSkill }: Props) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState<Record<string, boolean>>(
    () => Object.fromEntries(SKILL_CATEGORIES.map((c) => [c.id, true])),
  );

  const filtered = SKILL_CATEGORIES.map<SkillCategory>((c) => ({
    ...c,
    skills: c.skills.filter((s) =>
      (s.name + " " + s.description)
        .toLowerCase()
        .includes(query.toLowerCase()),
    ),
  })).filter((c) => c.skills.length > 0);

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-2">
      <div className="px-1">
        <div className="glass flex items-center gap-2 rounded-lg border border-white/10 px-2.5 py-1.5">
          <Search size={13} className="text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search skills…"
            className="w-full bg-transparent text-xs outline-none placeholder:text-muted-foreground/60"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pr-1">
        <div className="flex flex-col gap-3">
          {filtered.map((cat) => (
            <div key={cat.id}>
              <button
                onClick={() =>
                  setExpanded((e) => ({ ...e, [cat.id]: !e[cat.id] }))
                }
                className="mb-1 flex w-full items-center gap-1 px-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/80 hover:text-foreground"
              >
                <ChevronRight
                  size={10}
                  className={cn(
                    "transition-transform",
                    expanded[cat.id] && "rotate-90",
                  )}
                />
                {cat.name}
              </button>
              <AnimatePresence initial={false}>
                {expanded[cat.id] && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.18 }}
                    className="overflow-hidden"
                  >
                    <div className="flex flex-col gap-0.5">
                      {cat.skills.map((s) => {
                        const running = runningSkill === s.name;
                        return (
                          <button
                            key={s.id}
                            onClick={() => onInsertSkill(s.name)}
                            className={cn(
                              "group relative flex items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition",
                              "hover:bg-white/[0.04] hover:shadow-[0_0_18px_rgba(99,102,241,0.18)]",
                            )}
                          >
                            <span
                              className={cn(
                                "h-1.5 w-1.5 shrink-0 rounded-full transition",
                                running
                                  ? "bg-cyan shadow-[0_0_10px_#22d3ee] animate-pulse"
                                  : "bg-white/15 group-hover:bg-violet",
                              )}
                            />
                            <span className="font-mono text-[11px] text-foreground/85 group-hover:text-white truncate">
                              {s.name}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
