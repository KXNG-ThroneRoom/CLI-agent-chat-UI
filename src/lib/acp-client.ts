/**
 * Agent Client Protocol (ACP) client for Hermes.
 *
 * Spawns `hermes acp` as a single long-lived subprocess and exchanges
 * newline-framed JSON-RPC 2.0 messages over stdio. This avoids the
 * ~17s cold-start tax of spawning `hermes chat -q` per message.
 *
 * Protocol: https://agentclientprotocol.com (Zed's open agent protocol).
 */

import { spawn, type ChildProcess } from "node:child_process";
import { hermesCmd } from "./hermes";
import { nanoid } from "./utils";
import type { SSEEvent, ToolCall } from "./types";

type JSONRPCMsg = {
  jsonrpc: "2.0";
  id?: number;
  method?: string;
  params?: unknown;
  result?: unknown;
  error?: { code: number; message: string };
};

type Pending = {
  resolve: (v: unknown) => void;
  reject: (e: Error) => void;
};

class ACPClient {
  private child: ChildProcess | null = null;
  private initPromise: Promise<void> | null = null;
  private nextId = 1;
  private pending = new Map<number, Pending>();
  private buffer = "";
  /** Listeners keyed by ACP sessionId, fired on each session/update. */
  private sessionHandlers = new Map<string, (update: any) => void>();
  /** Maps UI-generated session IDs to hermes ACP session IDs. */
  private sessionMap = new Map<string, string>();

  ensureReady(): Promise<void> {
    if (!this.initPromise) this.initPromise = this.init();
    return this.initPromise;
  }

  private async init(): Promise<void> {
    const { cmd, args } = hermesCmd();
    const child = spawn(cmd, [...args, "acp"], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ["pipe", "pipe", "pipe"],
    });
    this.child = child;

    child.stdout.on("data", (buf: Buffer) => this.onStdout(buf));
    child.stderr.on("data", (buf: Buffer) => {
      // hermes acp logs status to stderr — surface in dev only
      if (process.env.NODE_ENV !== "production") {
        process.stderr.write(`[hermes acp] ${buf}`);
      }
    });
    child.on("exit", (code) => {
      console.error(`[hermes acp] exited with code ${code}`);
      this.cleanup();
    });
    child.on("error", (err) => {
      console.error(`[hermes acp] spawn error:`, err);
      this.cleanup();
    });

    // Client-initiated handshake
    await this.request("initialize", {
      protocolVersion: 1,
      clientCapabilities: {
        fs: { readTextFile: false, writeTextFile: false },
      },
    });
  }

  private cleanup() {
    this.child = null;
    this.initPromise = null;
    for (const p of this.pending.values()) {
      p.reject(new Error("hermes acp process exited"));
    }
    this.pending.clear();
    this.sessionHandlers.clear();
    this.sessionMap.clear();
  }

  private onStdout(buf: Buffer) {
    this.buffer += buf.toString("utf8");
    while (true) {
      const nl = this.buffer.indexOf("\n");
      if (nl === -1) break;
      const line = this.buffer.slice(0, nl).trim();
      this.buffer = this.buffer.slice(nl + 1);
      if (!line) continue;
      try {
        this.dispatch(JSON.parse(line) as JSONRPCMsg);
      } catch (e) {
        console.error(`[acp] failed to parse line:`, line, e);
      }
    }
  }

  private dispatch(msg: JSONRPCMsg) {
    // Response to a request we sent
    if (typeof msg.id === "number" && !msg.method) {
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.error) p.reject(new Error(msg.error.message));
      else p.resolve(msg.result);
      return;
    }

    // Notification from agent
    if (msg.method === "session/update") {
      const params = msg.params as { sessionId: string; update: any };
      const handler = this.sessionHandlers.get(params.sessionId);
      if (handler) handler(params.update);
      return;
    }

    // Request from agent that expects a response
    if (msg.method && typeof msg.id === "number") {
      // Auto-approve permission prompts; decline anything else.
      if (msg.method === "session/request_permission") {
        const params = msg.params as { options?: Array<{ optionId: string }> };
        const optionId =
          params.options?.find((o) => o.optionId === "allow")?.optionId ??
          params.options?.[0]?.optionId ??
          "allow";
        this.send({
          jsonrpc: "2.0",
          id: msg.id,
          result: { outcome: { outcome: "selected", optionId } },
        });
      } else {
        this.send({
          jsonrpc: "2.0",
          id: msg.id,
          error: { code: -32601, message: `Method not supported: ${msg.method}` },
        });
      }
    }
  }

  private send(msg: JSONRPCMsg) {
    if (!this.child?.stdin?.writable) return;
    this.child.stdin.write(JSON.stringify(msg) + "\n");
  }

  private request(method: string, params?: unknown): Promise<any> {
    return new Promise((resolve, reject) => {
      const id = this.nextId++;
      this.pending.set(id, { resolve, reject });
      this.send({ jsonrpc: "2.0", id, method, params });
    });
  }

  async prompt(
    uiSessionId: string,
    message: string,
    onUpdate: (update: any) => void,
  ): Promise<void> {
    await this.ensureReady();

    let sessionId = this.sessionMap.get(uiSessionId);
    if (!sessionId) {
      const result = await this.request("session/new", {
        cwd: process.cwd(),
        mcpServers: [],
      });
      sessionId = (result as { sessionId: string }).sessionId;
      this.sessionMap.set(uiSessionId, sessionId);
    }

    this.sessionHandlers.set(sessionId, onUpdate);
    try {
      await this.request("session/prompt", {
        sessionId,
        prompt: [{ type: "text", text: message }],
      });
    } finally {
      this.sessionHandlers.delete(sessionId);
    }
  }
}

/** Survives Next.js dev hot-reloads via globalThis. */
type GlobalWithACP = typeof globalThis & { __hermesACP?: ACPClient };

function getClient(): ACPClient {
  const g = globalThis as GlobalWithACP;
  if (!g.__hermesACP) g.__hermesACP = new ACPClient();
  return g.__hermesACP;
}

/** Maps an ACP session/update payload to our SSEEvent stream. */
function mapUpdate(update: any, emit: (e: SSEEvent) => void) {
  switch (update?.sessionUpdate) {
    case "agent_message_chunk":
    case "agent_thought_chunk": {
      const text = update.content?.text;
      if (typeof text === "string") emit({ type: "token", text });
      return;
    }
    case "tool_call": {
      const tool: ToolCall = {
        id: update.toolCallId ?? nanoid(8),
        name: update.title ?? update.kind ?? "tool",
        argsPreview: update.rawInput
          ? JSON.stringify(update.rawInput).slice(0, 160)
          : undefined,
        status: "running",
        startedAt: Date.now(),
      };
      emit({ type: "tool_start", tool });
      return;
    }
    case "tool_call_update": {
      if (Array.isArray(update.content)) {
        for (const c of update.content) {
          const text = c?.content?.text ?? c?.text;
          if (typeof text === "string") {
            emit({ type: "tool_output", id: update.toolCallId, output: text });
          }
        }
      }
      if (update.status === "completed" || update.status === "failed") {
        emit({
          type: "tool_end",
          id: update.toolCallId,
          status: update.status === "completed" ? "done" : "error",
        });
      }
      return;
    }
  }
}

/**
 * Drop-in replacement for runHermes. Uses a single long-lived
 * `hermes acp` subprocess instead of spawning one per message.
 */
export function runHermesACP(opts: {
  message: string;
  sessionId?: string;
  skill?: string; // preloaded via initialize; ignored here for now
  onEvent: (e: SSEEvent) => void;
  onClose: () => void;
}): () => void {
  const client = getClient();
  const uiSessionId = opts.sessionId ?? nanoid(8);
  const started = Date.now();
  let cancelled = false;
  let tokens = 0;

  const emit = (e: SSEEvent) => {
    if (cancelled) return;
    if (e.type === "token") tokens += e.text.length;
    opts.onEvent(e);
  };

  client
    .prompt(uiSessionId, opts.message, (update) => mapUpdate(update, emit))
    .then(() => {
      if (cancelled) return;
      opts.onEvent({
        type: "done",
        durationMs: Date.now() - started,
        tokensUsed: Math.round(tokens / 4),
        tokensMax: 64000,
      });
      opts.onClose();
    })
    .catch((err: Error) => {
      if (cancelled) return;
      opts.onEvent({ type: "error", message: err.message });
      opts.onClose();
    });

  return () => {
    cancelled = true;
  };
}
