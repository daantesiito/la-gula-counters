// POST endpoint — manual control of the sub counter (reset + manual add per channel).
// Intended for testing and moderator correction; not exposed to the public.

import { getSubState, setSubState, DEFAULT_SUB_STATE } from '@/lib/kv'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

type ControlBody =
  | { action: 'reset' }
  | { action: 'add'; channel: 'mortedor' | 'nanoide' | 'melianvalen'; amount: number }

export async function POST(request: NextRequest) {
  const body = (await request.json()) as ControlBody

  switch (body.action) {
    case 'reset': {
      await setSubState({ ...DEFAULT_SUB_STATE, byChannel: { ...DEFAULT_SUB_STATE.byChannel } })
      return NextResponse.json({ ok: true })
    }

    case 'add': {
      const state = await getSubState()
      state.byChannel[body.channel] += body.amount
      state.total += body.amount
      await setSubState(state)
      return NextResponse.json({ ok: true, state })
    }

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }
}
