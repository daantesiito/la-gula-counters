import { getChallengeState, setChallengeState } from '@/lib/kv'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type ControlBody =
  | { action: 'start'; minutes: number }
  | { action: 'pause' }
  | { action: 'resume' }
  | { action: 'reset' }

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ControlBody
  const state = await getChallengeState()

  switch (body.action) {
    case 'start': {
      const totalMs = body.minutes * 60 * 1000
      state.status = 'running'
      state.totalMs = totalMs
      state.remainingMs = totalMs
      state.startedAt = Date.now()
      break
    }

    case 'pause':
      if (state.status === 'running' && state.startedAt !== null) {
        state.remainingMs = Math.max(0, state.remainingMs - (Date.now() - state.startedAt))
      }
      state.status = 'paused'
      state.startedAt = null
      break

    case 'resume':
      if (state.status === 'paused') {
        state.status = 'running'
        state.startedAt = Date.now()
      }
      break

    case 'reset':
      state.status = 'idle'
      state.remainingMs = state.totalMs
      state.startedAt = null
      break

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  await setChallengeState(state)
  return NextResponse.json({ ok: true, state })
}
