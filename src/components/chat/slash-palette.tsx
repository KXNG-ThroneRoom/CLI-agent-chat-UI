"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Command } from "lucide-react";
import { cn } from "@/lib/utils";

export type PaletteItem = {
  name: string;
  hint: string;
  kind: "skill" | "cmd";
};

type Props = {
  items: PaletteItem[];
  query: string;
  open: boolean;
  activeIndex: number;
  onSelect: (name: string) => void;
  onHover: (idx: number) => void;
};

export function SlashPalette({
  items,
  query,
  open,
  activeIndex,
  onSelect,
  onHover,
}: Props) {
  return (
    <AnimatePresence>
      {open && items.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 4, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 4, scale: 0.98 }}
          transition={{ duration: 0.14 }}
          className="glass-strong absolute bottom-full left-0 right-0 mb-2 max-h-80 overflow-auto scrollbar-thin rounded-xl p-1 shadow-2xl z-20"
        >
          <div className="flex items-center gap-2 border-b border-white/5 px-3 py-2 text-[10px] uppercase tracking-wider text-muted-foreground/70">
            <Command size={11} />
            <span>{query ? `Matching "${query}"` : "Commands & Skills"}</span>
          </div>
          <div className="p-1">
            {items.map((item, idx) => (
              <button
                key={item.name + idx}
                onClick={() => onSelect(item.name)}
                onMouseEnter={() => onHover(idx)}
                className={cn(
                  "group flex w-full items-center gap-3 rounded-md px-2 py-2 text-left text-sm transition-colors",
                  idx === activeIndex
                    ? "bg-violet/15 text-white"
                    : "text-foreground/80 hover:bg-white/[0.04]",
                )}
              >
                <span
                  className={cn(
                    "rounded-md border border-white/10 px-1.5 py-0.5 font-mono text-[10px]",
                    item.kind === "skill"
                      ? "text-cyan bg-cyan/5"
                      : "text-violet-glow bg-violet/10",
                  )}
                >
                  {item.kind === "skill" ? "skill" : "cmd"}
                </span>
                <span className="font-mono text-xs">/{item.name}</span>
                <span className="ml-auto truncate text-[11px] text-muted-foreground/80">
                  {item.hint}
                </span>
              </button>
            ))}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
