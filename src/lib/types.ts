export type Role = "user" | "assistant" | "system";

export type ToolCall = {
  id: string;
  name: string;
  args?: Record<string, unknown>;
  argsPreview?: string;
  output?: string;
  status: "running" | "done" | "error";
  startedAt: number;
  endedAt?: number;
};

export type ChatMessage = {
  id: string;
  role: Role;
  content: string;
  toolCalls: ToolCall[];
  createdAt: number;
  durationMs?: number;
  tokensUsed?: number;
  tokensMax?: number;
};

export type SSEEvent =
  | { type: "token"; text: string }
  | { type: "tool_start"; tool: ToolCall }
  | { type: "tool_output"; id: string; output: string }
  | { type: "tool_end"; id: string; status: "done" | "error" }
  | { type: "done"; durationMs: number; tokensUsed: number; tokensMax: number }
  | { type: "error"; message: string };

export type MemoryFact = {
  id: string;
  text: string;
  tags?: string[];
  createdAt: number;
};

export type ActiveProcess = {
  id: string;
  command: string;
  pid?: number;
  startedAt: number;
  status: "running" | "exited";
};

export type CronJob = {
  id: string;
  name: string;
  schedule: string;
  nextRun?: number;
  lastRun?: number;
  command: string;
};

export type SessionSummary = {
  id: string;
  title: string;
  preview: string;
  updatedAt: number;
  messageCount: number;
};
