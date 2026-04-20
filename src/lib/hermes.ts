import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { nanoid } from "./utils";
import type { SSEEvent, ToolCall } from "./types";

/**
 * Returns the configured Hermes home directory.
 * Defaults to ~/.hermes but honors HERMES_HOME.
 */
export function hermesHome(): string {
  return process.env.HERMES_HOME || path.join(os.homedir(), ".hermes");
}

/**
 * Returns the command to invoke Hermes. Honors HERMES_CMD env var.
 */
export function hermesCmd(): { cmd: string; args: string[] } {
  const raw = process.env.HERMES_CMD || "hermes";
  const parts = raw.split(" ").filter(Boolean);
  return { cmd: parts[0], args: parts.slice(1) };
}

/**
 * Tests whether the hermes binary seems available on PATH.
 * We don't block on this — if it's missing the chat route falls back
 * to a simulator so the UI is usable out of the box.
 */
export function hermesAvailable(): boolean {
  const { cmd } = hermesCmd();
  if (cmd.includes("/") || cmd.includes(path.sep)) {
    return existsSync(cmd);
  }
  const pathEnv = process.env.PATH || "";
  const exts = process.platform === "win32" ? [".exe", ".cmd", ".bat", ""] : [""];
  for (const dir of pathEnv.split(path.delimiter)) {
    for (const ext of exts) {
      if (existsSync(path.join(dir, cmd + ext))) return true;
    }
  }
  return false;
}

/**
 * Parses Hermes streamed stdout into high-level SSE events.
 *
 * Recognised markers (conservatively scoped so we fall back cleanly):
 *   <tool_call name="read_file" id="abc" args='{"path":"x"}'>
 *   </tool_call>
 *   <tool_output id="abc">...</tool_output>
 *   <tool_end id="abc" status="done"/>
 * Any non-marker text is treated as assistant tokens and streamed through.
 */
export class HermesParser {
  private buffer = "";

  feed(chunk: string): SSEEvent[] {
    this.buffer += chunk;
    const events: SSEEvent[] = [];

    while (true) {
      const markerIdx = this.buffer.indexOf("<");
      if (markerIdx === -1) {
        if (this.buffer.length) {
          events.push({ type: "token", text: this.buffer });
          this.buffer = "";
        }
        break;
      }

      if (markerIdx > 0) {
        events.push({ type: "token", text: this.buffer.slice(0, markerIdx) });
        this.buffer = this.buffer.slice(markerIdx);
      }

      const closeIdx = this.buffer.indexOf(">");
      if (closeIdx === -1) {
        // incomplete tag, wait for more
        break;
      }

      const tag = this.buffer.slice(0, closeIdx + 1);
      this.buffer = this.buffer.slice(closeIdx + 1);

      const startMatch = tag.match(
        /^<tool_call\s+name="([^"]+)"(?:\s+id="([^"]+)")?(?:\s+args='([^']*)')?\s*\/?>/
      );
      if (startMatch) {
        const call: ToolCall = {
          id: startMatch[2] ?? nanoid(8),
          name: startMatch[1],
          argsPreview: startMatch[3],
          status: "running",
          startedAt: Date.now(),
        };
        events.push({ type: "tool_start", tool: call });
        continue;
      }

      const outputOpen = tag.match(/^<tool_output\s+id="([^"]+)">/);
      if (outputOpen) {
        const id = outputOpen[1];
        const closeTag = "</tool_output>";
        const endIdx = this.buffer.indexOf(closeTag);
        if (endIdx === -1) {
          // need more data; put back the open tag
          this.buffer = tag + this.buffer;
          break;
        }
        const output = this.buffer.slice(0, endIdx);
        this.buffer = this.buffer.slice(endIdx + closeTag.length);
        events.push({ type: "tool_output", id, output });
        continue;
      }

      const endMatch = tag.match(
        /^<tool_end\s+id="([^"]+)"(?:\s+status="([^"]+)")?\s*\/?>/
      );
      if (endMatch) {
        events.push({
          type: "tool_end",
          id: endMatch[1],
          status: (endMatch[2] as "done" | "error") ?? "done",
        });
        continue;
      }

      // not a known marker — treat as literal text
      events.push({ type: "token", text: tag });
    }

    return events;
  }

  flush(): SSEEvent[] {
    if (!this.buffer.length) return [];
    const ev: SSEEvent = { type: "token", text: this.buffer };
    this.buffer = "";
    return [ev];
  }
}

/**
 * Spawns hermes CLI and streams parsed events to `onEvent`.
 * Returns a cancel function.
 */
export function runHermes(opts: {
  message: string;
  sessionId?: string;
  skill?: string;
  onEvent: (e: SSEEvent) => void;
  onClose: () => void;
}): () => void {
  const { cmd, args } = hermesCmd();
  const baseArgs = [...args, "chat"];
  if (opts.skill) baseArgs.push("--skills", opts.skill);

  const started = Date.now();
  const child = spawn(cmd, baseArgs, {
    cwd: process.cwd(),
    env: process.env,
  });

  // Pipe message via stdin (hermes chat is an interactive REPL, not --message flag)
  child.stdin.write(opts.message + "\n");
  child.stdin.end();
  child.stdin.on("error", () => {}); // suppress EPIPE if hermes closes stdin early

  const parser = new HermesParser();
  let tokens = 0;

  child.stdout.on("data", (buf: Buffer) => {
    const chunk = buf.toString("utf8");
    tokens += chunk.length;
    for (const ev of parser.feed(chunk)) opts.onEvent(ev);
  });

  child.stderr.on("data", (buf: Buffer) => {
    opts.onEvent({ type: "token", text: buf.toString("utf8") });
  });

  child.on("error", (err) => {
    opts.onEvent({ type: "error", message: err.message });
    opts.onClose();
  });

  child.on("close", () => {
    for (const ev of parser.flush()) opts.onEvent(ev);
    opts.onEvent({
      type: "done",
      durationMs: Date.now() - started,
      tokensUsed: Math.round(tokens / 4),
      tokensMax: 64000,
    });
    opts.onClose();
  });

  return () => {
    child.kill("SIGTERM");
  };
}

/**
 * Simulator used when the hermes binary isn't installed. Keeps the UI
 * fully functional for local demos — streams a cinematic response with
 * a couple of tool calls.
 */
export function runSimulator(opts: {
  message: string;
  skill?: string;
  onEvent: (e: SSEEvent) => void;
  onClose: () => void;
}): () => void {
  let cancelled = false;
  const started = Date.now();
  let tokens = 0;

  const emit = (e: SSEEvent, delay: number) =>
    new Promise<void>((resolve) => {
      setTimeout(() => {
        if (cancelled) return resolve();
        if (e.type === "token") tokens += e.text.length;
        opts.onEvent(e);
        resolve();
      }, delay);
    });

  const streamText = async (text: string, perChar = 12) => {
    for (const ch of text) {
      if (cancelled) return;
      await emit({ type: "token", text: ch }, perChar);
    }
  };

  (async () => {
    const skillPrefix = opts.skill ? `_Using skill **${opts.skill}**._\n\n` : "";
    const preamble =
      skillPrefix +
      "I'm Hermes (running in simulator mode — install the CLI to enable the real agent). " +
      "Let me work through this.\n\n";
    await streamText(preamble, 8);

    const readId = nanoid(8);
    await emit(
      {
        type: "tool_start",
        tool: {
          id: readId,
          name: "read_file",
          argsPreview: JSON.stringify({ path: "README.md" }),
          status: "running",
          startedAt: Date.now(),
        },
      },
      250
    );
    await emit(
      {
        type: "tool_output",
        id: readId,
        output: "# Project\n\nA local-first tool for chatting with Hermes.",
      },
      550
    );
    await emit({ type: "tool_end", id: readId, status: "done" }, 120);

    await streamText(
      "\nHere's what I'd do next:\n\n1. Outline the approach\n2. Draft a plan\n3. Execute with care\n\n",
      6
    );

    const termId = nanoid(8);
    await emit(
      {
        type: "tool_start",
        tool: {
          id: termId,
          name: "terminal",
          argsPreview: JSON.stringify({ cmd: "ls -la" }),
          status: "running",
          startedAt: Date.now(),
        },
      },
      250
    );
    await emit(
      {
        type: "tool_output",
        id: termId,
        output: "total 24\ndrwxr-xr-x  src\n-rw-r--r--  package.json",
      },
      700
    );
    await emit({ type: "tool_end", id: termId, status: "done" }, 120);

    await streamText(
      "\nYou asked: _\"" +
        opts.message.slice(0, 120) +
        (opts.message.length > 120 ? "…" : "") +
        "\"_\n\n",
      6
    );
    await streamText(
      "Hook up the real `hermes` CLI by setting `HERMES_CMD=hermes` and I'll stream its output live.",
      8
    );

    await emit(
      {
        type: "done",
        durationMs: Date.now() - started,
        tokensUsed: Math.round(tokens / 4),
        tokensMax: 64000,
      },
      40
    );
    opts.onClose();
  })();

  return () => {
    cancelled = true;
    opts.onClose();
  };
}
