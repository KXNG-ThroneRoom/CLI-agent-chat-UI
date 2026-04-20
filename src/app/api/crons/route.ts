import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { hermesHome } from "@/lib/hermes";
import type { CronJob } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK: CronJob[] = [
  {
    id: "c1",
    name: "daily-arxiv-digest",
    schedule: "0 8 * * *",
    nextRun: Date.now() + 1000 * 60 * 60 * 12,
    lastRun: Date.now() - 1000 * 60 * 60 * 12,
    command: "hermes run skill arxiv --query 'LLM agents'",
  },
  {
    id: "c2",
    name: "pr-review-sweep",
    schedule: "*/30 * * * *",
    nextRun: Date.now() + 1000 * 60 * 18,
    lastRun: Date.now() - 1000 * 60 * 12,
    command: "hermes run skill github-pr-workflow --sweep",
  },
];

export async function GET() {
  try {
    const dir = path.join(hermesHome(), "cron");
    const entries = await fs.readdir(dir);
    const jobs: CronJob[] = [];
    for (const entry of entries.filter((f) => f.endsWith(".json"))) {
      const raw = await fs.readFile(path.join(dir, entry), "utf8");
      jobs.push(JSON.parse(raw));
    }
    return NextResponse.json({ jobs });
  } catch {
    return NextResponse.json({ jobs: FALLBACK });
  }
}
