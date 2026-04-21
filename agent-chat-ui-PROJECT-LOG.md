Monday April 20th 2026 7:47 pm CLAUDE CODE. 

# PROJECT LOG
## CURRENT FOCUS (READ FIRST — DO NOT DRIFT)
- Fix streaming (UI buffering tokens, dumping at end)
- Improve tool output formatting (reduce raw JSON noise)
- Add debug panel (raw stdout + events)
Ignore:
- mobile apps
- multi-device sync
- advanced memory systems
---
## FULL SYSTEM CONTEXT (REFERENCE)
### What it is
A local-first Electron + Next.js 14 chat UI that connects to the user's `hermes` CLI agent (which runs LM Studio with gemma-4-e4b as the backend). The UI streams responses via SSE.
### Current state (working)
- First message: ~18s (cold start — `hermes acp` daemon spawns once)
- Subsequent messages: ~2-4s (daemon stays alive, no cold start)
- CSS/UI stable — no more crash on first message
- Tool calls display inline in messages
- Sessions persist across messages within the same UI session
### Repo & branch
- Repo: `kxng-throneroom/cli-agent-chat-ui`
- Active dev branch: `claude/hermes-ai-chat-ui-CnOnC`
- Always develop on this branch, push with:

git push -u origin claude/hermes-ai-chat-ui-CnOnC

### Architecture

Electron → Next.js (port 3000) → /api/chat route (SSE)
↓
acp-client.ts
(singleton ACPClient)
↓ stdio JSON-RPC 2.0
hermes acp subprocess
↓
LM Studio (gemma-4-e4b)

### Key files
| File | Role |
|------|------|
| `src/app/api/chat/route.ts` | SSE endpoint — receives POST `{message, sessionId, skill}`, streams SSEEvents |
| `src/lib/acp-client.ts` | Core — long-lived `hermes acp` subprocess, JSON-RPC 2.0, session management |
| `src/lib/hermes.ts` | `hermesAvailable()` check + `HermesParser` + fallback `runSimulator` |
| `src/lib/types.ts` | `SSEEvent`, `ChatMessage`, `ToolCall`, etc. |
| `src/lib/utils.ts` | `nanoid`, `formatTokens`, `formatDuration`, etc. |
### ACP Protocol (JSON-RPC 2.0 over stdio)
**Handshake on startup:**
```json
{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":1,"clientCapabilities":{"fs":{"readTextFile":false,"writeTextFile":false}}}}

New session:

{"jsonrpc":"2.0","id":2,"method":"session/new","params":{"cwd":"/path","mcpServers":[]}}

Send message:

{"jsonrpc":"2.0","id":3,"method":"session/prompt","params":{"sessionId":"hermes-abc123","prompt":[{"type":"text","text":"hello"}]}}

Event mapping

* agent_message_chunk → { type: "token", text }
* agent_thought_chunk → dropped
* tool_call → { type: "tool_start", tool }
* tool_call_update (completed/failed) → { type: "tool_end" }
* tool_call_update (content) → { type: "tool_output" }

Session management

* UI generates uiSessionId
* Maps → hermes sessionId
* Reused across messages
* Reset on process restart

Env vars

Var	Default	Purpose
HERMES_CMD	hermes	Override binary
HERMES_HOME	~/.hermes	Config dir

⸻

KNOWN ISSUES

1. Streaming not working (UI buffers → dumps full response)
2. Tool output is raw JSON (bad UX)
3. No graceful ACP restart (sessionMap wiped)
4. Skill routing not wired
5. Token counting is approximate
6. No true cancellation support

⸻

DEV COMMANDS

npm run dev
npm run electron:dev
npm run build

⸻

DAILY LOG

[Day 1]

What was done

* Built Hermes UI (Electron + Next.js)
* Integrated Hermes ACP client (JSON-RPC over stdio)
* Implemented SSE streaming pipeline
* Added tool call rendering
* Stabilized UI

What works

* Cold start ~18s, then ~2–4s responses
* Tool calls visible
* Sessions persist

What’s broken

* Streaming not real-time
* Tool output messy
* Agent repeats some tool calls

Decisions made

* Local-first architecture
* Hermes as agent layer
* LM Studio (Gemma 4) backend

Next steps

* Trace streaming pipeline (find buffering layer)
* Fix token streaming
* Clean tool output UI
* Add debug panel (raw logs)

⸻

## CURRENT HANDOFF STATE (FOR NEXT MODEL)

### System status
- Streaming: NOT working (buffered)
- Backend: Hermes ACP OK
- Model: Gemma 4 via LM Studio (~50 tok/sec confirmed)

### Current problem
UI is buffering tokens instead of streaming.

### Hypothesis
Buffering happening in one of:
1. `/api/chat/route.ts`
2. SSE event writer
3. Frontend event listener

### Next task (DO THIS FIRST)
Add logging at:
- Hermes stdout
- ACP parser
- SSE emit
- Frontend receive

Compare timestamps to find where delay starts.

### Rules
- Do NOT add new features
- Only debug streaming