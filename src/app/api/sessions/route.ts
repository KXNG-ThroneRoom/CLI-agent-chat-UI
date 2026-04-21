import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { hermesHome } from "@/lib/hermes";
import type { SessionSummary } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    return NextResponse.json({ sessions: [] });
  }
}
