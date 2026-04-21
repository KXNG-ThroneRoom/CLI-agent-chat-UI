"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { ArrowUp, Square } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SlashPalette, type PaletteItem } from "./slash-palette";
import { allSkills } from "@/lib/skills";
import { cn } from "@/lib/utils";

type Props = {
  onSend: (text: string, skill?: string) => void;
  onStop: () => void;
  streaming: boolean;
  prefill?: string | null;
  onPrefillConsumed?: () => void;
};

export function InputBar({
  onSend,
  onStop,
  streaming,
  prefill,
  onPrefillConsumed,
}: Props) {
  const [value, setValue] = useState("");
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [paletteQuery, setPaletteQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const taRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (prefill) {
      setValue((v) => (v.endsWith(" ") || !v ? v + prefill : v + " " + prefill));
      onPrefillConsumed?.();
      requestAnimationFrame(() => taRef.current?.focus());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prefill]);

  useEffect(() => {
    const ta = taRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    ta.style.height = Math.min(ta.scrollHeight, 200) + "px";
  }, [value]);

  const items: PaletteItem[] = useMemo(() => {
    const q = paletteQuery.toLowerCase().trim();
    const base: PaletteItem[] = [
      { name: "skill", hint: "Run a skill", kind: "cmd" },
      { name: "clear", hint: "Clear conversation", kind: "cmd" },
      { name: "session", hint: "Switch session", kind: "cmd" },
      ...allSkills().map<PaletteItem>((s) => ({
        name: s.name,
        hint: s.description,
        kind: "skill",
      })),
    ];
    if (!q) return base.slice(0, 10);
    return base.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 10);
  }, [paletteQuery]);

  const openPaletteIfSlash = (v: string) => {
    const m = v.match(/(?:^|\s)\/(\w*)$/);
    if (m) {
      setPaletteOpen(true);
      setPaletteQuery(m[1]);
      setActiveIdx(0);
    } else {
      setPaletteOpen(false);
    }
  };

  const insertSlash = (name: string) => {
    setValue((v) =>
      v.replace(/(?:^|\s)\/\w*$/, (match) => {
        const lead = match.startsWith(" ") ? " " : "";
        return `${lead}/${name} `;
      }),
    );
    setPaletteOpen(false);
    taRef.current?.focus();
  };

  const submit = () => {
    const text = value.trim();
    if (!text) return;

    if (text === "/clear") {
      window.dispatchEvent(new CustomEvent("hermes:clear"));
      setValue("");
      return;
    }

    let skill: string | undefined;
    let payload = text;
    const sm = text.match(/^\/skill\s+(\S+)\s+([\s\S]+)/);
    const single = text.match(/^\/(\S+)\s+([\s\S]+)/);
    if (sm) {
      skill = sm[1];
      payload = sm[2];
    } else if (single && single[1] !== "skill") {
      skill = single[1];
      payload = single[2];
    }
    onSend(payload, skill);
    setValue("");
    setPaletteOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (paletteOpen) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIdx((i) => Math.min(items.length - 1, i + 1));
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIdx((i) => Math.max(0, i - 1));
        return;
      }
      if (e.key === "Escape") {
        e.preventDefault();
        setPaletteOpen(false);
        return;
      }
      if (e.key === "Tab" || (e.key === "Enter" && !e.shiftKey)) {
        e.preventDefault();
        const selected = items[activeIdx];
        if (selected) insertSlash(selected.name);
        return;
      }
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    } else if (e.key === "Escape") {
      setValue("");
    }
  };

  return (
    <div className="relative">
      <SlashPalette
        items={items}
        query={paletteQuery}
        open={paletteOpen}
        activeIndex={activeIdx}
        onHover={setActiveIdx}
        onSelect={insertSlash}
      />

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={cn(
          "glass flex items-end gap-2 rounded-2xl border border-white/10 px-3 py-2 transition-all",
          "focus-within:border-violet/60 focus-within:shadow-[0_0_40px_rgba(99,102,241,0.25)]",
        )}
      >
        <textarea
          ref={taRef}
          rows={1}
          value={value}
          onChange={(e) => {
            setValue(e.target.value);
            openPaletteIfSlash(e.target.value);
          }}
          onKeyDown={onKeyDown}
          placeholder="Message Hermes…  /  for skills, Shift+Enter for newline"
          className="max-h-[200px] min-h-[28px] flex-1 resize-none bg-transparent px-2 py-1.5 text-sm outline-none placeholder:text-muted-foreground/60 scrollbar-thin"
        />

        {streaming ? (
          <Button
            onClick={onStop}
            size="icon"
            className="mt-0.5 !bg-rose-500/80 hover:!bg-rose-500 shadow-[0_0_20px_rgba(244,63,94,0.45)]"
            title="Stop"
          >
            <Square size={14} />
          </Button>
        ) : (
          <Button
            onClick={submit}
            size="icon"
            disabled={!value.trim()}
            className="mt-0.5"
            title="Send"
          >
            <ArrowUp size={15} />
          </Button>
        )}
      </motion.div>
    </div>
  );
}
