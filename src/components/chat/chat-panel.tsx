"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Sparkles } from "lucide-react";
import { InputBar } from "./input-bar";
import { Message } from "./message";
import { useChat } from "@/hooks/use-chat";
import type { ToolCall } from "@/lib/types";

type Props = {
  sessionTitle: string;
  sessionId: string;
  prefill: string | null;
  onPrefillConsumed: () => void;
  onActivity: (calls: ToolCall[]) => void;
};

export function ChatPanel({
  sessionTitle,
  sessionId,
  prefill,
  onPrefillConsumed,
  onActivity,
}: Props) {
  const { messages, streaming, activeToolCalls, send, stop, setMessages } =
    useChat();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [autoScroll, setAutoScroll] = useState(true);

  useEffect(() => {
    onActivity(activeToolCalls);
  }, [activeToolCalls, onActivity]);

  useEffect(() => {
    if (!autoScroll) return;
    const el = scrollRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
  }, [messages, autoScroll]);

  useEffect(() => {
    const handler = () => setMessages([]);
    window.addEventListener("hermes:clear", handler);
    return () => window.removeEventListener("hermes:clear", handler);
  }, [setMessages]);

  const onScroll = () => {
    const el = scrollRef.current;
    if (!el) return;
    const atBottom =
      el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setAutoScroll(atBottom);
  };

  return (
    <div className="grid-bg relative flex h-full flex-col overflow-hidden">
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-ink-950" />

      {/* Session header */}
      <motion.div
        initial={{ opacity: 0, y: -6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative z-10 flex items-center justify-center gap-3 px-6 py-3"
      >
        <div className="glass rounded-full px-4 py-1.5 text-xs text-muted-foreground">
          <span className="mr-2 inline-block h-1.5 w-1.5 rounded-full bg-cyan shadow-[0_0_8px_#22d3ee] align-middle" />
          <span className="font-mono tracking-wide">{sessionTitle}</span>
          <span className="ml-2 text-muted-foreground/50 font-mono text-[10px]">
            {sessionId.slice(0, 8)}
          </span>
        </div>
      </motion.div>

      {/* Messages */}
      <div
        ref={scrollRef}
        onScroll={onScroll}
        className="relative z-10 flex-1 overflow-y-auto scrollbar-thin px-6 pb-6"
      >
        <div className="mx-auto flex max-w-3xl flex-col gap-4 pt-6">
          {messages.length === 0 && <EmptyState />}
          {messages.map((m) => (
            <Message key={m.id} message={m} />
          ))}
          <div className="h-4" />
        </div>
      </div>

      {/* Input */}
      <div className="relative z-10 px-6 pb-5 pt-2">
        <div className="mx-auto max-w-3xl">
          <InputBar
            onSend={(text, skill) => send(text, { skill, sessionId })}
            onStop={stop}
            streaming={streaming}
            prefill={prefill}
            onPrefillConsumed={onPrefillConsumed}
          />
          <div className="mt-2 flex items-center justify-between px-2 text-[10px] text-muted-foreground/60 font-mono">
            <span>Enter to send · Shift+Enter newline · / for skills</span>
            <span>local · {streaming ? "streaming…" : "ready"}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="mx-auto mt-24 flex max-w-lg flex-col items-center text-center"
    >
      <div className="mb-5 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-violet/20 to-cyan/10 shadow-[0_0_40px_rgba(99,102,241,0.35)]">
        <Sparkles size={28} className="text-violet-glow" />
      </div>
      <h2 className="text-gradient bg-clip-text text-2xl font-semibold tracking-tight">
        Hermes is online
      </h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Ask anything. Start with <kbd className="kbd">/</kbd> to browse skills,
        or jump in:
      </p>
      <div className="mt-6 grid w-full grid-cols-1 gap-2">
        {[
          "Summarize my recent arXiv papers",
          "Open a PR for my latest changes",
          "Debug the failing test in auth.spec.ts",
          "Draft a writing plan for the new feature",
        ].map((s) => (
          <button
            key={s}
            onClick={() =>
              window.dispatchEvent(
                new CustomEvent("hermes:prefill", { detail: s }),
              )
            }
            className="glass rounded-xl px-3 py-2 text-left text-sm text-foreground/85 transition hover:border-violet/40 hover:shadow-[0_0_25px_rgba(99,102,241,0.2)]"
          >
            {s}
          </button>
        ))}
      </div>
    </motion.div>
  );
}
