// POST endpoint — mutates timer state en KV.
// El timer es un cronómetro que sube desde 00:00 sin límite.
// Acciones: start | pause | resume | add | subtract | reset

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
      state.elapsedMs = 0
      break

    case 'pause':
      if (state.status === 'running' && state.startedAt !== null) {
        // Acumula el tiempo transcurrido hasta ahora
        state.elapsedMs = state.elapsedMs + (Date.now() - state.startedAt)
      }
      state.status = 'paused'
      state.startedAt = null
      break

    case 'resume':
      state.status = 'running'
      state.startedAt = Date.now()
      break

    case 'add':
      // Suma segundos al tiempo acumulado (salta el cronómetro hacia adelante)
      state.elapsedMs += body.seconds * 1000
      break

    case 'subtract': {
      // Resta segundos del tiempo total actual y resetea el punto de inicio
      const currentTotal =
        state.status === 'running' && state.startedAt !== null
          ? state.elapsedMs + (Date.now() - state.startedAt)
          : state.elapsedMs
      const newTotal = Math.max(0, currentTotal - body.seconds * 1000)
      state.elapsedMs = newTotal
      if (state.status === 'running') {
        state.startedAt = Date.now() // resetea el punto de inicio para que no haya salto
      }
      break
    }

    case 'reset':
      state.status = 'idle'
      state.elapsedMs = 0
      state.startedAt = null
      break

    default:
      return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
  }

  await setTimerState(state)
  return NextResponse.json({ ok: true, state })
}
