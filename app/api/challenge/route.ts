import { NextRequest } from 'next/server'
import { getChallengeState, setChallengeState } from '@/lib/kv'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()
  let intervalId: ReturnType<typeof setInterval> | undefined

  const stream = new ReadableStream({
    start(controller) {
      const send = async () => {
        try {
          let state = await getChallengeState()
          if (state.status === 'running' && state.startedAt !== null) {
            const remaining = state.remainingMs - (Date.now() - state.startedAt)
            if (remaining <= 0) {
              state = { ...state, status: 'finished', remainingMs: 0, startedAt: null }
              await setChallengeState(state)
            }
          }
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
