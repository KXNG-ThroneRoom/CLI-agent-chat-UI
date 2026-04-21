"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage, SSEEvent, ToolCall } from "@/lib/types";
import { nanoid } from "@/lib/utils";

type SendOpts = { skill?: string; sessionId?: string };
const DEBUG_STREAM = process.env.NODE_ENV !== "production";

export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [streaming, setStreaming] = useState(false);
  const [activeToolCalls, setActiveToolCalls] = useState<ToolCall[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const stop = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    setStreaming(false);
  }, []);

  const send = useCallback(
    async (text: string, opts: SendOpts = {}) => {
      if (!text.trim() || streaming) return;

      const userMsg: ChatMessage = {
        id: nanoid(10),
        role: "user",
        content: text,
        toolCalls: [],
        createdAt: Date.now(),
      };
      const asstId = nanoid(10);
      const asstMsg: ChatMessage = {
        id: asstId,
        role: "assistant",
        content: "",
        toolCalls: [],
        createdAt: Date.now(),
      };

      setMessages((m) => [...m, userMsg, asstMsg]);
      setStreaming(true);

      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: text,
            sessionId: opts.sessionId,
            skill: opts.skill,
          }),
          signal: controller.signal,
        });

        if (!res.ok || !res.body) throw new Error("Stream failed");

        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let buf = "";

        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          buf += decoder.decode(value, { stream: true });
          if (DEBUG_STREAM) {
            console.debug("[stream][ui-chunk]", {
              at: new Date().toISOString(),
              chars: value?.length ?? 0,
            });
          }

          const parts = buf.split("\n\n");
          buf = parts.pop() ?? "";

          for (const part of parts) {
            const line = part.trim();
            if (!line.startsWith("data:")) continue;
            const data = line.slice(5).trim();
            if (!data) continue;
            let event: SSEEvent;
            try {
              event = JSON.parse(data);
            } catch {
              continue;
            }
            if (DEBUG_STREAM) {
              console.debug("[stream][ui-event]", {
                at: new Date().toISOString(),
                type: event.type,
              });
            }
            applyEvent(event, asstId, setMessages, setActiveToolCalls);
          }
        }
      } catch (err) {
        if ((err as Error).name !== "AbortError") {
          setMessages((m) =>
            m.map((msg) =>
              msg.id === asstId
                ? {
                    ...msg,
                    content:
                      msg.content +
                      `\n\n> **Error:** ${(err as Error).message}`,
                  }
                : msg,
            ),
          );
        }
      } finally {
        setStreaming(false);
        setActiveToolCalls([]);
        abortRef.current = null;
      }
    },
    [streaming],
  );

  return { messages, streaming, activeToolCalls, send, stop, setMessages };
}

function applyEvent(
  event: SSEEvent,
  asstId: string,
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>,
  setActive: React.Dispatch<React.SetStateAction<ToolCall[]>>,
) {
  switch (event.type) {
    case "token": {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === asstId ? { ...msg, content: msg.content + event.text } : msg,
        ),
      );
      break;
    }
    case "tool_start": {
      setActive((a) => [event.tool, ...a]);
      setMessages((m) =>
        m.map((msg) =>
          msg.id === asstId
            ? { ...msg, toolCalls: [...msg.toolCalls, event.tool] }
            : msg,
        ),
      );
      break;
    }
    case "tool_output": {
      setActive((a) =>
        a.map((t) => (t.id === event.id ? { ...t, output: event.output } : t)),
      );
      setMessages((m) =>
        m.map((msg) =>
          msg.id === asstId
            ? {
                ...msg,
                toolCalls: msg.toolCalls.map((t) =>
                  t.id === event.id ? { ...t, output: event.output } : t,
                ),
              }
            : msg,
        ),
      );
      break;
    }
    case "tool_end": {
      setActive((a) => a.filter((t) => t.id !== event.id));
      setMessages((m) =>
        m.map((msg) =>
          msg.id === asstId
            ? {
                ...msg,
                toolCalls: msg.toolCalls.map((t) =>
                  t.id === event.id
                    ? { ...t, status: event.status, endedAt: Date.now() }
                    : t,
                ),
              }
            : msg,
        ),
      );
      break;
    }
    case "done": {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === asstId
            ? {
                ...msg,
                durationMs: event.durationMs,
                tokensUsed: event.tokensUsed,
                tokensMax: event.tokensMax,
              }
            : msg,
        ),
      );
      break;
    }
    case "error": {
      setMessages((m) =>
        m.map((msg) =>
          msg.id === asstId
            ? { ...msg, content: msg.content + `\n\n> ${event.message}` }
            : msg,
        ),
      );
      break;
    }
  }
}
