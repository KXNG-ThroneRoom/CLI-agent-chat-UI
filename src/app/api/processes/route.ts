import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { hermesHome } from "@/lib/hermes";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const file = path.join(hermesHome(), "processes.json");
    const raw = await fs.readFile(file, "utf8");
    return NextResponse.json({ processes: JSON.parse(raw) });
  } catch {
    return NextResponse.json({ processes: [] });
  }
}
