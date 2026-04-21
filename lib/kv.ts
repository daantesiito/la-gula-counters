import { Redis } from '@upstash/redis'

// Upstash Redis client — env vars injected automatically when you connect
// an Upstash store from the Vercel marketplace.
const redis = new Redis({
  url: process.env.KV_REST_API_URL!,
  token: process.env.KV_REST_API_TOKEN!,
})

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
  const state = await redis.get<TimerState>(TIMER_KEY)
  return state ?? DEFAULT_TIMER_STATE
}

export async function setTimerState(state: TimerState): Promise<void> {
  await redis.set(TIMER_KEY, state)
}

// ---------------------------------------------------------------------------
// Sub counter helpers
// ---------------------------------------------------------------------------

export async function getSubState(): Promise<SubState> {
  const state = await redis.get<SubState>(SUBS_KEY)
  return state ?? DEFAULT_SUB_STATE
}

export async function setSubState(state: SubState): Promise<void> {
  await redis.set(SUBS_KEY, state)
}
