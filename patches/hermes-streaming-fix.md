# Hermes Streaming Fix

## Problem
Hermes ACP was not streaming responses incrementally.
All responses were buffered and sent as a single chunk.

## Root Cause
Hermes ACP used the wrong callback:
- `message_callback` → buffered
- `stream_delta_callback` → required for real streaming

## Fix

### File modified
~/.hermes/hermes-agent/acp_adapter/server.py

### Changes

```diff
+        streamed_text = False

-            message_cb = make_message_cb(conn, session_id, loop)
+            _base_message_cb = make_message_cb(conn, session_id, loop)
+
+            def _message_cb(text: str) -> None:
+                nonlocal streamed_text
+                if not text:
+                    return
+                streamed_text = True
+                _base_message_cb(text)

-        agent.message_callback = message_cb
+        agent.stream_delta_callback = _message_cb if conn else None

-        if final_response and conn:
+        if final_response and conn and not streamed_text:
```

## Result
- Tokens stream incrementally
- UI renders live
- No duplicate final response

## Restart Command

```bash
pkill -f 'hermes acp'; /Users/amirtbz/.local/bin/hermes acp
```