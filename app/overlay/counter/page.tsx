'use client'

// OBS Browser Source — Simple counter overlay
// Recommended size: 300 × 150 px
// Connects to /api/counter via SSE and updates in real time.

import { useEffect, useState } from 'react'
import type { CounterState } from '@/lib/kv'

export default function CounterOverlay() {
  const [counter, setCounter] = useState<CounterState>({ value: 0 })

  useEffect(() => {
    const es = new EventSource('/api/counter')
    es.onmessage = (event: MessageEvent<string>) => {
      setCounter(JSON.parse(event.data) as CounterState)
    }
    return () => es.close()
  }, [])

  return (
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
        style={{
          color: '#fff',
          fontSize: '120px',
          fontWeight: 700,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          lineHeight: 1,
        }}
      >
        {counter.value}
      </span>
    </div>
  )
}
