'use client'

// OBS Browser Source — Timer overlay
// Recommended size: 400 × 150 px
// Connects to /api/timer via SSE and recomputes the display every 100 ms client-side.

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import type { TimerState } from '@/lib/kv'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatTime(ms: number): string {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000))
  const hours = Math.floor(totalSeconds / 3600)
  const minutes = Math.floor((totalSeconds % 3600) / 60)
  const seconds = totalSeconds % 60

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((n) => String(n).padStart(2, '0'))
      .join(':')
  }
  return [minutes, seconds].map((n) => String(n).padStart(2, '0')).join(':')
}

function getDisplayMs(state: TimerState): number {
  if (state.status === 'running' && state.startedAt !== null) {
    return state.elapsedMs + (Date.now() - state.startedAt)
  }
  return state.elapsedMs
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function TimerOverlay() {
  const [timerState, setTimerState] = useState<TimerState>({
    status: 'idle',
    elapsedMs: 0,
    startedAt: null,
  })
  // Dummy tick counter — forces a re-render every 100 ms so the countdown
  // stays smooth even between SSE updates.
  const [, setTick] = useState(0)

  // SSE connection — EventSource auto-reconnects on drop (retry: 3000)
  useEffect(() => {
    const es = new EventSource('/api/timer')
    es.onmessage = (event: MessageEvent<string>) => {
      setTimerState(JSON.parse(event.data) as TimerState)
    }
    return () => es.close()
  }, [])

  // 100 ms tick for smooth client-side interpolation
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 100)
    return () => clearInterval(id)
  }, [])

  const displayMs = getDisplayMs(timerState)
  const isPaused = timerState.status === 'paused'

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
        {isPaused ? (
          <span
            className="blink"
            style={{
              color: '#fff',
              fontSize: '72px',
              fontWeight: 700,
              fontFamily: "'Courier New', Courier, monospace",
              letterSpacing: '0.08em',
              lineHeight: 1,
            }}
          >
            PAUSADO
          </span>
        ) : (
          <span
            style={{
              color: '#fff',
              fontSize: '90px',
              fontWeight: 700,
              fontFamily: "'Courier New', Courier, monospace",
              letterSpacing: '0.05em',
              lineHeight: 1,
            }}
          >
            {formatTime(displayMs)}
          </span>
        )}
      </div>
    </>
  )
}
