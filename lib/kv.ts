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
  elapsedMs: number     // ms acumulados al momento del último pause
  startedAt: number | null  // Date.now() cuando se inició/resumió
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
  elapsedMs: 0,
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
// Challenge timer
// ---------------------------------------------------------------------------

export type ChallengeTimerState = {
  status: 'idle' | 'running' | 'paused' | 'finished'
  totalMs: number
  remainingMs: number
  startedAt: number | null
}

export const DEFAULT_CHALLENGE_STATE: ChallengeTimerState = {
  status: 'idle',
  totalMs: 0,
  remainingMs: 0,
  startedAt: null,
}

const CHALLENGE_KEY = 'challenge:state'

export async function getChallengeState(): Promise<ChallengeTimerState> {
  const state = await redis.get<ChallengeTimerState>(CHALLENGE_KEY)
  return state ?? DEFAULT_CHALLENGE_STATE
}

export async function setChallengeState(state: ChallengeTimerState): Promise<void> {
  await redis.set(CHALLENGE_KEY, state)
}

// ---------------------------------------------------------------------------
// Simple counter
// ---------------------------------------------------------------------------

export type CounterState = {
  value: number
}

export const DEFAULT_COUNTER_STATE: CounterState = { value: 0 }

const COUNTER_KEY = 'counter:state'

export async function getCounterState(): Promise<CounterState> {
  const state = await redis.get<CounterState>(COUNTER_KEY)
  return state ?? { ...DEFAULT_COUNTER_STATE }
}

export async function setCounterState(state: CounterState): Promise<void> {
  await redis.set(COUNTER_KEY, state)
}

// ---------------------------------------------------------------------------
// Sub counter helpers
// ---------------------------------------------------------------------------

export async function getSubState(): Promise<SubState> {
  const state = await redis.get<SubState>(SUBS_KEY)
  if (!state) return { ...DEFAULT_SUB_STATE, byChannel: { ...DEFAULT_SUB_STATE.byChannel } }
  return {
    total: Number(state.total) || 0,
    byChannel: {
      mortedor: Number(state.byChannel?.mortedor) || 0,
      nanoide: Number(state.byChannel?.nanoide) || 0,
      melianvalen: Number(state.byChannel?.melianvalen) || 0,
    },
  }
}

export async function setSubState(state: SubState): Promise<void> {
  await redis.set(SUBS_KEY, state)
}
