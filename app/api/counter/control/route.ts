import { getCounterState, setCounterState, DEFAULT_COUNTER_STATE } from '@/lib/kv'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type ControlBody =
  | { action: 'increment' }
  | { action: 'decrement' }
  | { action: 'reset' }

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ControlBody

  switch (body.action) {
    case 'increment': {
      const state = await getCounterState()
      state.value += 1
      await setCounterState(state)
      return NextResponse.json({ ok: true, state })
    }

    case 'decrement': {
      const state = await getCounterState()
      state.value -= 1
      await setCounterState(state)
      return NextResponse.json({ ok: true, state })
    }

    case 'reset': {
      await setCounterState({ ...DEFAULT_COUNTER_STATE })
      return NextResponse.json({ ok: true })
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
