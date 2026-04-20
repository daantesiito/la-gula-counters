import { kv } from '@vercel/kv'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TimerState = {
  status: 'idle' | 'running' | 'paused'
  remainingMs: number   // ms remaining as of the last start/resume
  startedAt: number | null  // Date.now() when last started/resumed
}

export type SubState = {
  total: number
  byChannel: {
    mortedor: number
    nanoide: number
    melianvalen: number
  }
}

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const DEFAULT_TIMER_STATE: TimerState = {
  status: 'idle',
  remainingMs: 0,
  startedAt: null,
}

export const DEFAULT_SUB_STATE: SubState = {
  total: 0,
  byChannel: {
    mortedor: 0,
    nanoide: 0,
    melianvalen: 0,
  },
}

// ---------------------------------------------------------------------------
// KV keys
// ---------------------------------------------------------------------------

const TIMER_KEY = 'timer:state'
const SUBS_KEY = 'subs:state'

// ---------------------------------------------------------------------------
// Timer helpers
// ---------------------------------------------------------------------------

export async function getTimerState(): Promise<TimerState> {
  const state = await kv.get<TimerState>(TIMER_KEY)
  return state ?? DEFAULT_TIMER_STATE
}

export async function setTimerState(state: TimerState): Promise<void> {
  await kv.set(TIMER_KEY, state)
}

// ---------------------------------------------------------------------------
// Sub counter helpers
// ---------------------------------------------------------------------------

export async function getSubState(): Promise<SubState> {
  const state = await kv.get<SubState>(SUBS_KEY)
  return state ?? DEFAULT_SUB_STATE
}

export async function setSubState(state: SubState): Promise<void> {
  await kv.set(SUBS_KEY, state)
}
