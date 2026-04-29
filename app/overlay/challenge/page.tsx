'use client'

// OBS Browser Source — Challenge timer overlay (cuenta regresiva)
// Recommended size: 400 × 150 px
// Connects to /api/challenge via SSE and recomputes the display every 100 ms client-side.

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import type { ChallengeTimerState } from '@/lib/kv'

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

function getDisplayMs(state: ChallengeTimerState): number {
  if (state.status === 'running' && state.startedAt !== null) {
    return Math.max(0, state.remainingMs - (Date.now() - state.startedAt))
  }
  return Math.max(0, state.remainingMs)
}

export default function ChallengeOverlay() {
  const [state, setState] = useState<ChallengeTimerState>({
    status: 'idle',
    totalMs: 0,
    remainingMs: 0,
    startedAt: null,
  })
  const [, setTick] = useState(0)

  useEffect(() => {
    const es = new EventSource('/api/challenge')
    es.onmessage = (event: MessageEvent<string>) => {
      setState(JSON.parse(event.data) as ChallengeTimerState)
    }
    return () => es.close()
  }, [])

  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100)
    return () => clearInterval(id)
  }, [])

  const displayMs = getDisplayMs(state)
  const isPaused = state.status === 'paused'
  const isFinished = state.status === 'finished'

  return (
    <>
      <style>{`
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.15; }
        }
        .blink { animation: blink 1.4s ease-in-out infinite; }
      `}</style>
      <div
        style={{
          width: '100vw',
          height: '100vh',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <span
          className={isPaused || isFinished ? 'blink' : undefined}
          style={{
            color: '#fff',
            fontSize: '90px',
            fontWeight: 700,
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
            letterSpacing: '0.05em',
            lineHeight: 1,
          }}
        >
          {formatTime(displayMs)}
        </span>
      </div>
    </>
  )
}
