// SSE endpoint — streams SubState to all connected clients every 1000 ms.
// Uses Edge Runtime for long-lived streaming responses on Vercel.

import { getSubState } from '@/lib/kv'

export const runtime = 'edge'
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const encoder = new TextEncoder()
  let closed = false

  const stream = new ReadableStream({
    async start(controller) {
      try {
        // Send retry hint + initial state immediately on connect
        const initial = await getSubState()
        controller.enqueue(
          encoder.encode(`retry: 3000\n\ndata: ${JSON.stringify(initial)}\n\n`)
        )

        // Poll KV every 1000 ms and push current state
        while (!closed) {
          await new Promise<void>((resolve) => setTimeout(resolve, 1000))
          if (closed) break

          const state = await getSubState()
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
