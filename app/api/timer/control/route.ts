// POST endpoint — mutates timer state in KV.
// Accepted actions: start | pause | resume | add | subtract | reset

import { getTimerState, setTimerState } from '@/lib/kv'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type ControlBody =
  | { action: 'start' }
  | { action: 'pause' }
  | { action: 'resume' }
  | { action: 'add'; seconds: number }
  | { action: 'subtract'; seconds: number }
  | { action: 'reset' }

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ControlBody
  const state = await getTimerState()

  switch (body.action) {
    case 'start':
      state.status = 'running'
      state.startedAt = Date.now()
      break

    case 'pause':
      if (state.status === 'running' && state.startedAt !== null) {
        // Freeze the remaining time so it reflects elapsed duration
        state.remainingMs = Math.max(0, state.remainingMs - (Date.now() - state.startedAt))
      }
      state.status = 'paused'
      state.startedAt = null
      break

    case 'resume':
      state.status = 'running'
      state.startedAt = Date.now()
      break

    case 'add':
      state.remainingMs += body.seconds * 1000
      break

    case 'subtract':
      state.remainingMs = Math.max(0, state.remainingMs - body.seconds * 1000)
      break

    case 'reset':
      state.status = 'idle'
      state.remainingMs = 0
      state.startedAt = null
      break

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  await setTimerState(state)
  return NextResponse.json({ ok: true, state })
}
