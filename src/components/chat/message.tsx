"use client";

import { motion } from "framer-motion";
import { Sparkles, User } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import { ToolCallCard } from "./tool-call-card";
import { cn, formatDuration, formatTokens } from "@/lib/utils";

export function Message({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
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
          "group relative max-w-[78%] min-w-0",
          isUser ? "items-end text-right" : "items-start",
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
          {message.content ? (
            <div className="whitespace-pre-wrap break-words">
              {message.content}
            </div>
          ) : (
            !isUser && <TypingDots />
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
