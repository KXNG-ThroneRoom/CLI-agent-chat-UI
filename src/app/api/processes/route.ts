import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { hermesHome } from "@/lib/hermes";
import type { ActiveProcess } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK: ActiveProcess[] = [
  {
    id: "p1",
    command: "npm run dev",
    pid: 42231,
    startedAt: Date.now() - 1000 * 60 * 14,
    status: "running",
  },
  {
    id: "p2",
    command: "tail -f logs/hermes.log",
    pid: 42298,
    startedAt: Date.now() - 1000 * 60 * 6,
    status: "running",
  },
];

export async function GET() {
  try {
    const file = path.join(hermesHome(), "processes.json");
    const raw = await fs.readFile(file, "utf8");
    return NextResponse.json({ processes: JSON.parse(raw) });
  } catch {
    return NextResponse.json({ processes: FALLBACK });
  }
}
