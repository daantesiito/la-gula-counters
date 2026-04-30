'use client'

// Moderator control panel — /control
// No authentication required. Keep this URL private.

import { useEffect, useRef, useState } from 'react'
import type { ChallengeTimerState, CounterState, SubState, TimerState } from '@/lib/kv'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60
  if (hours > 0) {
    return [hours, minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':')
  }
  return [minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':')
}

function getTimerDisplayMs(state: TimerState): number {
  if (state.status === 'running' && state.startedAt !== null) {
    return state.elapsedMs + (Date.now() - state.startedAt)
  }
  return state.elapsedMs
}

function getChallengeDisplayMs(state: ChallengeTimerState): number {
  if (state.status === 'running' && state.startedAt !== null) {
    return Math.max(0, state.remainingMs - (Date.now() - state.startedAt))
  }
  return Math.max(0, state.remainingMs)
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------

async function timerControl(body: object) {
  await fetch('/api/timer/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function challengeControl(body: object) {
  await fetch('/api/challenge/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function subsControl(body: object) {
  await fetch('/api/subs/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

async function counterControl(body: object) {
  await fetch('/api/counter/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const DEFAULT_TIMER: TimerState = { status: 'idle', elapsedMs: 0, startedAt: null }
const DEFAULT_CHALLENGE: ChallengeTimerState = {
  status: 'idle',
  totalMs: 0,
  remainingMs: 0,
  startedAt: null,
}
const DEFAULT_SUBS: SubState = {
  total: 0,
  byChannel: { mortedor: 0, nanoide: 0, melianvalen: 0 },
}
const DEFAULT_COUNTER: CounterState = { value: 0 }

export default function ControlPanel() {
  const [timer, setTimer] = useState<TimerState>(DEFAULT_TIMER)
  const [challenge, setChallenge] = useState<ChallengeTimerState>(DEFAULT_CHALLENGE)
  const [subs, setSubs] = useState<SubState>(DEFAULT_SUBS)
  const [counter, setCounter] = useState<CounterState>(DEFAULT_COUNTER)
  const [, setTick] = useState(0)

  // Timer adjustment refs
  const addSecsRef = useRef<HTMLInputElement>(null)
  const subSecsRef = useRef<HTMLInputElement>(null)

  // Challenge minutes input ref
  const challengeMinRef = useRef<HTMLInputElement>(null)

  // Sub manual add refs
  const mortRef = useRef<HTMLInputElement>(null)
  const nanoRef = useRef<HTMLInputElement>(null)
  const meliRef = useRef<HTMLInputElement>(null)

  // SSE — timer
  useEffect(() => {
    const es = new EventSource('/api/timer')
    es.onmessage = (e: MessageEvent<string>) => setTimer(JSON.parse(e.data))
    return () => es.close()
  }, [])

  // SSE — challenge timer
  useEffect(() => {
    const es = new EventSource('/api/challenge')
    es.onmessage = (e: MessageEvent<string>) => setChallenge(JSON.parse(e.data))
    return () => es.close()
  }, [])

  // SSE — subs
  useEffect(() => {
    const es = new EventSource('/api/subs')
    es.onmessage = (e: MessageEvent<string>) => setSubs(JSON.parse(e.data))
    return () => es.close()
  }, [])

  // SSE — counter
  useEffect(() => {
    const es = new EventSource('/api/counter')
    es.onmessage = (e: MessageEvent<string>) => setCounter(JSON.parse(e.data))
    return () => es.close()
  }, [])

  // 100 ms tick for smooth timer display
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100)
    return () => clearInterval(id)
  }, [])

  // Timer state flags
  const displayMs = getTimerDisplayMs(timer)
  const isRunning = timer.status === 'running'
  const isPaused = timer.status === 'paused'
  const isIdle = timer.status === 'idle'

  // Challenge timer state flags
  const challengeDisplayMs = getChallengeDisplayMs(challenge)
  const challengeIsIdle = challenge.status === 'idle'
  const challengeIsRunning = challenge.status === 'running'
  const challengeIsPaused = challenge.status === 'paused'
  const challengeIsFinished = challenge.status === 'finished'

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleAdd = async () => {
    const secs = Number(addSecsRef.current?.value ?? 0)
    if (!secs || secs <= 0) return
    await timerControl({ action: 'add', seconds: secs })
    if (addSecsRef.current) addSecsRef.current.value = ''
  }

  const handleSubtract = async () => {
    const secs = Number(subSecsRef.current?.value ?? 0)
    if (!secs || secs <= 0) return
    await timerControl({ action: 'subtract', seconds: secs })
    if (subSecsRef.current) subSecsRef.current.value = ''
  }

  const handleChallengeStart = async () => {
    const minutes = Number(challengeMinRef.current?.value ?? 0)
    if (!minutes || minutes <= 0) return
    await challengeControl({ action: 'start', minutes })
    if (challengeMinRef.current) challengeMinRef.current.value = ''
  }

  const handleManualAdd = async (
    channel: 'mortedor' | 'nanoide' | 'melianvalen',
    ref: React.RefObject<HTMLInputElement | null>
  ) => {
    const amount = Number(ref.current?.value ?? 1)
    if (!amount || amount <= 0) return
    await subsControl({ action: 'add', channel, amount })
    if (ref.current) ref.current.value = ''
  }

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6 md:p-10">
      <h1 className="text-2xl font-bold text-center mb-8 tracking-widest uppercase text-gray-300">
        Contadores Panel de Control
      </h1>

      {/* ------------------------------------------------------------------ */}
      {/* TOP ROW: Timer (left) + Timer de Retos (right)                      */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">

        {/* TIMER */}
        <section className="bg-gray-900 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Timer</h2>

          <div className="flex flex-col items-center mb-6">
            <span className="font-mono text-7xl font-bold tracking-tight">
              {formatTime(displayMs)}
            </span>
            <span
              className={`mt-2 text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full ${
                isRunning
                  ? 'bg-green-900 text-green-300'
                  : isPaused
                  ? 'bg-yellow-900 text-yellow-300 animate-pulse'
                  : 'bg-gray-800 text-gray-500'
              }`}
            >
              {timer.status}
            </span>
          </div>

          <div className="flex flex-wrap gap-3 justify-center mb-6">
            {isIdle && (
              <button
                onClick={() => timerControl({ action: 'start' })}
                className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm
                  bg-green-700 hover:bg-green-600 transition-colors"
              >
                Start
              </button>
            )}
            <button
              onClick={() => timerControl({ action: 'pause' })}
              disabled={!isRunning}
              className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm
                bg-yellow-700 hover:bg-yellow-600 disabled:opacity-30 disabled:cursor-not-allowed
                transition-colors"
            >
              Pause
            </button>
            <button
              onClick={() => timerControl({ action: 'resume' })}
              disabled={!isPaused}
              className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm
                bg-blue-700 hover:bg-blue-600 disabled:opacity-30 disabled:cursor-not-allowed
                transition-colors"
            >
              Resume
            </button>
            <button
              onClick={() => timerControl({ action: 'reset' })}
              className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm
                bg-red-800 hover:bg-red-700 transition-colors"
            >
              Reset
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex gap-2">
              <input
                ref={addSecsRef}
                type="number"
                min={1}
                placeholder="seg"
                className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none
                  focus:ring-2 focus:ring-green-600"
              />
              <button
                onClick={handleAdd}
                className="px-4 py-2 bg-green-800 hover:bg-green-700 rounded-lg text-sm
                  font-semibold transition-colors whitespace-nowrap"
              >
                + Agregar
              </button>
            </div>
            <div className="flex gap-2">
              <input
                ref={subSecsRef}
                type="number"
                min={1}
                placeholder="seg"
                className="flex-1 bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none
                  focus:ring-2 focus:ring-red-600"
              />
              <button
                onClick={handleSubtract}
                className="px-4 py-2 bg-red-900 hover:bg-red-800 rounded-lg text-sm
                  font-semibold transition-colors whitespace-nowrap"
              >
                − Restar
              </button>
            </div>
          </div>
        </section>

        {/* TIMER DE RETOS */}
        <section className="bg-gray-900 rounded-2xl p-6 shadow-xl">
          <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Timer de Retos</h2>

          <div className="flex flex-col items-center mb-6">
            <span className="font-mono text-7xl font-bold tracking-tight">
              {formatTime(challengeDisplayMs)}
            </span>
            <span
              className={`mt-2 text-xs uppercase tracking-widest font-semibold px-3 py-1 rounded-full ${
                challengeIsRunning
                  ? 'bg-green-900 text-green-300'
                  : challengeIsPaused
                  ? 'bg-yellow-900 text-yellow-300 animate-pulse'
                  : challengeIsFinished
                  ? 'bg-red-900 text-red-300 animate-pulse'
                  : 'bg-gray-800 text-gray-500'
              }`}
            >
              {challengeIsFinished ? 'terminado' : challenge.status}
            </span>
          </div>

          {/* Set minutes + START — solo cuando está idle */}
          {challengeIsIdle && (
            <div className="flex gap-2 justify-center mb-4">
              <input
                ref={challengeMinRef}
                type="number"
                min={1}
                placeholder="min"
                className="w-24 bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none
                  focus:ring-2 focus:ring-green-600 text-center"
              />
              <button
                onClick={handleChallengeStart}
                className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm
                  bg-green-700 hover:bg-green-600 transition-colors"
              >
                Start
              </button>
            </div>
          )}

          {/* Controls when active */}
          {!challengeIsIdle && (
            <div className="flex flex-wrap gap-3 justify-center mb-4">
              {challengeIsRunning && (
                <button
                  onClick={() => challengeControl({ action: 'pause' })}
                  className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm
                    bg-yellow-700 hover:bg-yellow-600 transition-colors"
                >
                  Pause
                </button>
              )}
              {challengeIsPaused && (
                <button
                  onClick={() => challengeControl({ action: 'resume' })}
                  className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm
                    bg-blue-700 hover:bg-blue-600 transition-colors"
                >
                  Resume
                </button>
              )}
              <button
                onClick={() => challengeControl({ action: 'reset' })}
                className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm
                  bg-red-800 hover:bg-red-700 transition-colors"
              >
                Reset
              </button>
            </div>
          )}
        </section>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* SUBS SECTION                                                         */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-gray-900 rounded-2xl p-6 shadow-xl">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Subs</h2>

        <div className="flex flex-col items-center mb-6">
          <span className="font-mono text-8xl font-bold">{subs.total}</span>
          <div className="flex gap-6 mt-4 text-center">
            {(
              [
                { label: 'Mortedor', key: 'mortedor' },
                { label: 'Nanoide', key: 'nanoide' },
                { label: 'Melianvalen', key: 'melianvalen' },
              ] as const
            ).map(({ label, key }) => (
              <div key={key} className="flex flex-col items-center">
                <span className="font-mono text-4xl font-bold text-purple-400">
                  {subs.byChannel[key]}
                </span>
                <span className="text-xs uppercase tracking-widest text-gray-500 mt-1">
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <button
            onClick={() => subsControl({ action: 'reset' })}
            className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm
              bg-red-900 hover:bg-red-800 transition-colors"
          >
            Reset Contador
          </button>
        </div>

        <div className="border-t border-gray-800 pt-4">
          <p className="text-xs uppercase tracking-widest text-gray-600 mb-3">
            Agregar manual (testing)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {(
              [
                { label: 'Mortedor', key: 'mortedor', ref: mortRef },
                { label: 'Nanoide', key: 'nanoide', ref: nanoRef },
                { label: 'Melianvalen', key: 'melianvalen', ref: meliRef },
              ] as const
            ).map(({ label, key, ref }) => (
              <div key={key} className="flex gap-2">
                <input
                  ref={ref}
                  type="number"
                  min={1}
                  defaultValue={1}
                  className="w-16 bg-gray-800 rounded-lg px-3 py-2 text-sm outline-none
                    focus:ring-2 focus:ring-purple-600"
                />
                <button
                  onClick={() => handleManualAdd(key, ref)}
                  className="flex-1 px-3 py-2 bg-purple-900 hover:bg-purple-800 rounded-lg
                    text-sm font-semibold transition-colors"
                >
                  +{label}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------------------ */}
      {/* COUNTER SECTION                                                      */}
      {/* ------------------------------------------------------------------ */}
      <section className="bg-gray-900 rounded-2xl p-6 shadow-xl mt-6">
        <h2 className="text-xs uppercase tracking-widest text-gray-500 mb-4">Contador MUERTES</h2>

        <div className="flex flex-col items-center mb-6">
          <span className="font-mono text-8xl font-bold">{counter.value}</span>
        </div>

        <div className="flex gap-4 justify-center mb-4">
          <button
            onClick={() => counterControl({ action: 'decrement' })}
            className="w-16 h-16 rounded-xl text-3xl font-bold bg-red-900 hover:bg-red-800 transition-colors"
          >
            −
          </button>
          <button
            onClick={() => counterControl({ action: 'increment' })}
            className="w-16 h-16 rounded-xl text-3xl font-bold bg-green-800 hover:bg-green-700 transition-colors"
          >
            +
          </button>
        </div>

        <div className="flex justify-center">
          <button
            onClick={() => counterControl({ action: 'reset' })}
            className="px-6 py-2 rounded-lg font-bold uppercase tracking-wider text-sm
              bg-red-900 hover:bg-red-800 transition-colors"
          >
            Reset
          </button>
        </div>
      </section>

      {/* Quick links */}
      <footer className="mt-8 flex flex-wrap gap-4 justify-center text-xs text-gray-600">
        <a href="/overlay/timer" target="_blank" className="hover:text-gray-400 transition-colors">
          ↗ Overlay Timer
        </a>
        <a href="/overlay/challenge" target="_blank" className="hover:text-gray-400 transition-colors">
          ↗ Overlay Timer de Retos
        </a>
        <a href="/overlay/subs" target="_blank" className="hover:text-gray-400 transition-colors">
          ↗ Overlay Subs
        </a>
        <a href="/overlay/counter" target="_blank" className="hover:text-gray-400 transition-colors">
          ↗ Overlay Contador
        </a>
      </footer>
    </div>
  )
}
