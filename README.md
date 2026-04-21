# Hermes Console

A cinematic, local-first Next.js UI for the Hermes CLI agent.

Dark-themed, glassmorphism-heavy, Raycast-meets-sci-fi-terminal.
Real-time streaming from the Hermes CLI via SSE, tool-call visualization,
live memory / processes / cron / session panels, and a `/`-triggered
skill palette.

## Quick start (web)

```bash
npm install
npm run dev
# open http://localhost:3000
```

The UI works out of the box in **simulator mode** — it streams a scripted
cinematic response so you can try the whole flow without installing Hermes.

## Run as a macOS app (dock icon + offline)

```bash
# one-time: generate the .icns icon (requires `brew install librsvg`)
./electron/make-icon.sh

# develop with hot-reload inside an Electron window
npm run electron:dev

# build a distributable .app + .dmg
npm run electron:build
# outputs: dist-electron/Hermes Console-0.1.0-arm64.dmg (and x64)
```

Open the generated `.dmg`, drag **Hermes Console** to `/Applications`, and
pin it to your dock. The app bundles the Next.js standalone server so it
runs fully offline — no dev server required.

First launch will show an "unidentified developer" warning since the app
isn't code-signed. Right-click → Open → Open to bypass (only needed once).

### Environment

Env vars you set in your shell (`HERMES_CMD`, `HERMES_HOME`) are inherited
by the packaged app when launched from Finder via `launchd`'s shell
environment. For rock-solid control, launch from a terminal:

```bash
HERMES_CMD=hermes open -a "Hermes Console"
```

## Connecting the real Hermes CLI

By default the server spawns `hermes chat --stream --message <text>`. If the
binary is on `$PATH`, it's used automatically. Otherwise the simulator runs.

Override with env vars:

| Variable      | Default          | Meaning                                                 |
| ------------- | ---------------- | ------------------------------------------------------- |
| `HERMES_CMD`  | `hermes`         | Command invoked to run Hermes. May include flags.       |
| `HERMES_HOME` | `~/.hermes`      | Root for `sessions/`, `cron/`, `memory/facts.json`, …   |

Example:

```bash
HERMES_CMD="/usr/local/bin/hermes --no-banner" \
HERMES_HOME="$HOME/.hermes" \
npm run dev
```

### Tool-call protocol

The backend parses these inline markers in Hermes' stdout and forwards them
as structured SSE events to the UI:

```
<tool_call name="read_file" id="abc" args='{"path":"src/x.ts"}'/>
<tool_output id="abc">…captured stdout…</tool_output>
<tool_end id="abc" status="done"/>
```

Everything outside those tags is streamed through as assistant tokens.

## Layout

```
┌───────── 240px ─────────┬────────── flex ──────────┬─── 280px ───┐
│  agent selector          │  session label           │  Memory      │
│  new session             │                          │  Processes   │
│  skills browser          │  chat transcript         │  Crons       │
│   · categorised          │    · user right-aligned  │  Sessions    │
│   · / inserts skill      │    · streaming tokens    │  Activity    │
│   · active glow dot      │    · tool cards          │              │
│                          │  input bar               │              │
└──────────────────────────┴──────────────────────────┴──────────────┘
```

## API routes

| Route                | Purpose                                              |
| -------------------- | ---------------------------------------------------- |
| `POST /api/chat`     | Spawn hermes, stream SSE events back                 |
| `GET /api/skills`    | `hermes skills list --json` + static fallback        |
| `GET /api/memory`    | Reads `$HERMES_HOME/memory/facts.json`               |
| `GET /api/processes` | Reads `$HERMES_HOME/processes.json`                  |
| `GET /api/crons`     | Reads `$HERMES_HOME/cron/*.json`                     |
| `GET /api/sessions`  | Reads `$HERMES_HOME/sessions/*.json`                 |

All routes return sensible fallback data when the respective files are
missing, so the UI is always fully populated.

## Keyboard

| Key             | Action                            |
| --------------- | --------------------------------- |
| `Enter`         | Send                              |
| `Shift+Enter`   | Newline                           |
| `Escape`        | Clear input / close palette       |
| `/`             | Open slash palette (skills + cmd) |
| `↑` / `↓`       | Navigate palette                  |
| `Tab` / `Enter` | Insert selected palette item      |

## Stack

- Next.js 14 (App Router, Node runtime for API routes)
- Tailwind CSS + `tailwindcss-animate`
- Framer Motion for panel, message, and tool-card animations
- shadcn-style primitives over Radix (`button`, `scroll-area`, `badge`)
- Lucide icons
- `child_process.spawn` for the Hermes bridge

## Local-only by design

No outbound network calls, no telemetry, no auth. Everything runs on
localhost and talks to a child process on your machine.
