import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { hermesHome } from "@/lib/hermes";
import type { MemoryFact } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const file = path.join(hermesHome(), "memory", "facts.json");
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as MemoryFact[];
    return NextResponse.json({ facts: parsed });
  } catch {
    return NextResponse.json({ facts: [] });
  }
}
