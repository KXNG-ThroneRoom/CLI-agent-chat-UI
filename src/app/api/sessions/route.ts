import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { hermesHome } from "@/lib/hermes";
import type { SessionSummary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK: SessionSummary[] = [
  {
    id: "s_today_1",
    title: "Refactor auth module",
    preview: "Let me start by reading the existing auth provider…",
    updatedAt: Date.now() - 1000 * 60 * 8,
    messageCount: 14,
  },
  {
    id: "s_today_2",
    title: "Debug failing CI run",
    preview: "The flaky test looks like a race condition in the worker pool.",
    updatedAt: Date.now() - 1000 * 60 * 55,
    messageCount: 22,
  },
  {
    id: "s_yesterday_1",
    title: "Draft arXiv summary",
    preview: "Here's a 3-paragraph summary of the paper on MoE routing…",
    updatedAt: Date.now() - 1000 * 60 * 60 * 20,
    messageCount: 8,
  },
  {
    id: "s_older_1",
    title: "Notion sync",
    preview: "Synced 12 pages from the Engineering workspace.",
    updatedAt: Date.now() - 1000 * 60 * 60 * 48,
    messageCount: 5,
  },
];

export async function GET() {
  try {
    const dir = path.join(hermesHome(), "sessions");
    const entries = await fs.readdir(dir);
    const sessions: SessionSummary[] = [];
    for (const entry of entries.filter((f) => f.endsWith(".json"))) {
      try {
        const raw = await fs.readFile(path.join(dir, entry), "utf8");
        const parsed = JSON.parse(raw);
        sessions.push({
          id: parsed.id ?? entry.replace(/\.json$/, ""),
          title: parsed.title ?? "Untitled session",
          preview: parsed.preview ?? "",
          updatedAt: parsed.updatedAt ?? Date.now(),
          messageCount: parsed.messageCount ?? 0,
        });
      } catch {
        // skip
      }
    }
    sessions.sort((a, b) => b.updatedAt - a.updatedAt);
    return NextResponse.json({ sessions });
  } catch {
    return NextResponse.json({ sessions: FALLBACK });
  }
}
