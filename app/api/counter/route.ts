import { NextRequest } from 'next/server'
import { getCounterState } from '@/lib/kv'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  let intervalId: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream({
    start(controller) {
      const send = async () => {
        try {
          const state = await getCounterState()
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(state)}\n\n`))
        } catch {
          clearInterval(intervalId)
          try { controller.close() } catch { /* already closed */ }
        }
      }

      controller.enqueue(encoder.encode('retry: 3000\n\n'))
      send()
      intervalId = setInterval(send, 1000)
    },
    cancel() {
      clearInterval(intervalId)
    },
  })

  request.signal.addEventListener('abort', () => {
    clearInterval(intervalId)
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'Connection': 'keep-alive',
      'X-Accel-Buffering': 'no',
    },
  })
}
