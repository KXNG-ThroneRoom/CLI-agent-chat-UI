import { NextRequest } from "next/server";
import {
  hermesAvailable,
  runHermes,
  runSimulator,
} from "@/lib/hermes";
import type { SSEEvent } from "@/lib/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { message, sessionId, skill } = await req.json();

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      const send = (event: SSEEvent) => {
        const payload = `data: ${JSON.stringify(event)}\n\n`;
        controller.enqueue(encoder.encode(payload));
      };

      const close = () => {
        try {
          controller.close();
        } catch {
          // already closed
        }
      };

      const runner = hermesAvailable() ? runHermes : runSimulator;
      const cancel = runner({
        message,
        sessionId,
        skill,
        onEvent: send,
        onClose: close,
      });

      req.signal.addEventListener("abort", () => {
        cancel();
        close();
      });
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}
