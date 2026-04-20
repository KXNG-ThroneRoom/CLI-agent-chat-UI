"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatPanel } from "@/components/chat/chat-panel";
import { LeftSidebar } from "@/components/sidebar/left-sidebar";
import { RightSidebar } from "@/components/sidebar/right-sidebar";
import type { ToolCall } from "@/lib/types";
import { nanoid } from "@/lib/utils";

const SESSION_TITLES = [
  "New conversation",
  "Untitled session",
  "Quick thought",
];

export default function Page() {
  const [agent, setAgent] = useState("hermes");
  const [sessionId, setSessionId] = useState("init");
  const [sessionTitle, setSessionTitle] = useState(SESSION_TITLES[0]);
  const [prefill, setPrefill] = useState<string | null>(null);
  const [activity, setActivity] = useState<ToolCall[]>([]);

  useEffect(() => {
    // Initialize session ID on client only to avoid hydration mismatch
    setSessionId(nanoid(12));

    const handler = (e: Event) => {
      const ce = e as CustomEvent<string>;
      setPrefill(ce.detail);
    };
    window.addEventListener("hermes:prefill", handler as EventListener);
    return () =>
      window.removeEventListener(
        "hermes:prefill",
        handler as EventListener,
      );
  }, []);

  const onInsertSkill = useCallback((name: string) => {
    setPrefill(`/skill ${name} `);
  }, []);

  const runningSkill =
    activity.find((t) => t.name.startsWith("skill"))?.name ?? null;

  const newSession = useCallback(() => {
    setSessionId(nanoid(12));
    setSessionTitle(SESSION_TITLES[0]);
    window.dispatchEvent(new CustomEvent("hermes:clear"));
  }, []);

  const loadSession = useCallback((id: string) => {
    setSessionId(id);
    setSessionTitle("Restored session");
    window.dispatchEvent(new CustomEvent("hermes:clear"));
  }, []);

  return (
    <main className="flex h-screen w-screen bg-ink-950">
      <LeftSidebar
        agent={agent}
        onAgentChange={setAgent}
        runningSkill={runningSkill}
        onInsertSkill={onInsertSkill}
        onNewSession={newSession}
      />
      <section className="flex min-w-0 flex-1">
        <ChatPanel
          sessionId={sessionId}
          sessionTitle={sessionTitle}
          prefill={prefill}
          onPrefillConsumed={() => setPrefill(null)}
          onActivity={setActivity}
        />
      </section>
      <RightSidebar activity={activity} onLoadSession={loadSession} />
    </main>
  );
}
