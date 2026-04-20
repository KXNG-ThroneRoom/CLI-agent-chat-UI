import { NextResponse } from "next/server";
import fs from "node:fs/promises";
import path from "node:path";
import { hermesHome } from "@/lib/hermes";
import type { MemoryFact } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const FALLBACK: MemoryFact[] = [
  {
    id: "m1",
    text: "User prefers dark-themed UIs and cinematic sci-fi aesthetics.",
    tags: ["preference", "design"],
    createdAt: Date.now() - 1000 * 60 * 60 * 6,
  },
  {
    id: "m2",
    text: "Primary dev branch: claude/hermes-ai-chat-ui-CnOnC.",
    tags: ["project"],
    createdAt: Date.now() - 1000 * 60 * 60 * 2,
  },
  {
    id: "m3",
    text: "Running two agents: Hermes (default) and Gemma 4 E4B.",
    tags: ["agents"],
    createdAt: Date.now() - 1000 * 60 * 30,
  },
];

export async function GET() {
  try {
    const file = path.join(hermesHome(), "memory", "facts.json");
    const raw = await fs.readFile(file, "utf8");
    const parsed = JSON.parse(raw) as MemoryFact[];
    return NextResponse.json({ facts: parsed });
  } catch {
    return NextResponse.json({ facts: FALLBACK });
  }
}
