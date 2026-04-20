import { NextResponse } from "next/server";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { hermesAvailable, hermesCmd } from "@/lib/hermes";
import { SKILL_CATEGORIES } from "@/lib/skills";

const exec = promisify(execFile);

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  if (!hermesAvailable()) {
    return NextResponse.json({ source: "static", categories: SKILL_CATEGORIES });
  }
  try {
    const { cmd, args } = hermesCmd();
    const { stdout } = await exec(cmd, [...args, "skills", "list", "--json"], {
      timeout: 5000,
    });
    const parsed = JSON.parse(stdout);
    return NextResponse.json({ source: "hermes", ...parsed });
  } catch {
    return NextResponse.json({ source: "static", categories: SKILL_CATEGORIES });
  }
}
