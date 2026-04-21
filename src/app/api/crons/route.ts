import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { hermesHome } from "@/lib/hermes";
import type { CronJob } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

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
    return NextResponse.json({ jobs: [] });
  }
}
