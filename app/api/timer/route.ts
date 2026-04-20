// SSE endpoint — streams TimerState to all connected clients every 500 ms.
// Uses Edge Runtime for long-lived streaming responses on Vercel.
// The client computes the live countdown locally between updates.

import { getTimerState } from '@/lib/kv'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send retry hint + initial state immediately on connect
        const initial = await getTimerState()
        controller.enqueue(
          encoder.encode(`retry: 3000\n\ndata: ${JSON.stringify(initial)}\n\n`)
        )

        // Poll KV every 500 ms and push current state
        while (!closed) {
          await new Promise<void>((resolve) => setTimeout(resolve, 500))
          if (closed) break

          const state = await getTimerState()
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(state)}\n\n`))
        }
      } catch {
        // Client disconnected or stream errored — exit cleanly
      } finally {
        try {
          controller.close()
        } catch {
          // already closed
        }
      }
    },
    cancel() {
      closed = true
    },
  })

  // Also mark as closed when the request is aborted (client navigates away)
  request.signal.addEventListener('abort', () => {
    closed = true
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
