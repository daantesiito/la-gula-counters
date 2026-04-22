'use client'

// OBS Browser Source — Subscription counter overlay
// Recommended size: 400 × 200 px
// Connects to /api/subs via SSE and updates in real time.

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import type { SubState } from '@/lib/kv'

const DEFAULT_STATE: SubState = {
  total: 0,
  byChannel: { mortedor: 0, nanoide: 0, melianvalen: 0 },
}

export default function SubsOverlay() {
  const [subState, setSubState] = useState<SubState>(DEFAULT_STATE)

  // SSE connection — EventSource auto-reconnects on drop (retry: 3000)
  useEffect(() => {
    const es = new EventSource('/api/subs')
    es.onmessage = (event: MessageEvent<string>) => {
      setSubState(JSON.parse(event.data) as SubState)
    }
    return () => es.close()
  }, [])

  const { total, byChannel } = subState

  return (
    <div
      style={{
        width: '100vw',
        height: '100vh',
        background: 'transparent',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '12px',
      }}
    >
      {/* Total sub count */}
      <span
        style={{
          color: '#fff',
          fontSize: '96px',
          fontWeight: 700,
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          lineHeight: 1,
        }}
      >
        {total}
      </span>

      {/* Per-channel breakdown */}
      <span
        style={{
          color: '#bbb',
          fontSize: '26px',
          fontFamily: "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace",
          letterSpacing: '0.03em',
        }}
      >
      </span>
    </div>
  )
}
