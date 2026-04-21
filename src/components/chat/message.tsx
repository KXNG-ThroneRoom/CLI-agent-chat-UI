"use client";

import { motion } from "framer-motion";
import { Check, Copy, Pencil, Save, Sparkles, User, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ChatMessage } from "@/lib/types";
import { ToolCallCard } from "./tool-call-card";
import { cn, formatDuration, formatTokens } from "@/lib/utils";

export function Message({
  message,
  onUpdate,
}: {
  message: ChatMessage;
  onUpdate: (id: string, content: string) => void;
}) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const copiedTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const formattedTime = message.createdAt
    ? new Date(message.createdAt).toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      })
    : "";

  useEffect(() => {
    return () => {
      if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    };
  }, []);

  const copyMessage = async () => {
    if (!message.content) return;

    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    if (copiedTimeoutRef.current) clearTimeout(copiedTimeoutRef.current);
    copiedTimeoutRef.current = setTimeout(() => setCopied(false), 1500);
  };

  const startEdit = () => {
    setEditingId(message.id);
    setDraft(message.content);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setDraft("");
  };

  const saveEdit = async () => {
    const res = await fetch(`/api/messages/${message.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: draft }),
    });
    if (!res.ok) throw new Error("Failed to save message");
    const updated = (await res.json()) as { content: string };
    onUpdate(message.id, updated.content);
    setEditingId(null);
    setDraft("");
  };

  const isEditing = editingId === message.id;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      className={cn(
        "flex w-full gap-3",
        isUser ? "justify-end" : "justify-start",
      )}
    >
      {!isUser && <Avatar role="assistant" />}
      <div
        className={cn(
          "group flex max-w-[78%] min-w-0 flex-col",
          isUser ? "items-end" : "items-start",
        )}
      >
        <div
          className={cn(
            "rounded-2xl px-4 py-2.5 text-sm leading-relaxed shadow-lg",
            isUser
              ? "bg-gradient-to-br from-violet/70 to-indigo-600/80 text-white shadow-[0_0_20px_rgba(99,102,241,0.25)]"
              : "glass text-foreground/95",
          )}
        >
          {isEditing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="min-h-24 w-full resize-y rounded-lg border border-white/10 bg-zinc-900 p-2 text-left text-sm text-white outline-none focus:border-cyan/50"
            />
          ) : message.content ? (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            !isUser && <TypingDots />
          )}
        </div>

        <div className="mt-1 flex max-w-full items-center gap-3 px-1 text-[11px] text-muted-foreground/75 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
          {formattedTime && (
            <span className="shrink-0 font-mono tabular-nums">
              {formattedTime}
            </span>
          )}
          {message.content && (
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <button
                    type="button"
                    onClick={saveEdit}
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 text-cyan transition hover:bg-white/5"
                  >
                    <Save size={13} />
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-white/5"
                  >
                    <X size={13} />
                    <span>Cancel</span>
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={copyMessage}
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-white/5 hover:text-foreground"
                    aria-label={copied ? "Copied message" : "Copy message"}
                  >
                    {copied ? <Check size={13} /> : <Copy size={13} />}
                    <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    type="button"
                    onClick={startEdit}
                    className="flex items-center gap-1 rounded-md px-1.5 py-0.5 transition hover:bg-white/5 hover:text-foreground"
                  >
                    <Pencil size={13} />
                    <span>Edit</span>
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {!isUser && message.toolCalls.length > 0 && (
          <div className="mt-1">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} call={tc} />
            ))}
          </div>
        )}

        {!isUser && (message.durationMs || message.tokensUsed) && (
          <div className="mt-1 flex items-center gap-2 text-[10px] text-muted-foreground/80 font-mono">
            {message.tokensUsed !== undefined && message.tokensMax && (
              <span>
                {formatTokens(message.tokensUsed)}/
                {formatTokens(message.tokensMax)}
              </span>
            )}
            {message.durationMs !== undefined && (
              <>
                <span className="opacity-50">·</span>
                <span>{formatDuration(message.durationMs)}</span>
              </>
            )}
          </div>
        )}
      </div>
      {isUser && <Avatar role="user" />}
    </motion.div>
  );
}

function Avatar({ role }: { role: "user" | "assistant" }) {
  if (role === "user") {
    return (
      <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-violet to-cyan text-white shadow-[0_0_14px_rgba(99,102,241,0.45)]">
        <User size={14} />
      </div>
    );
  }
  return (
    <div className="mt-1 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-white/10 bg-black/40 text-cyan shadow-[0_0_14px_rgba(34,211,238,0.35)]">
      <Sparkles size={14} />
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex items-center gap-1 py-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-violet-glow animate-dot-pulse"
          style={{ animationDelay: `${i * 0.16}s` }}
        />
      ))}
    </div>
  );
}
