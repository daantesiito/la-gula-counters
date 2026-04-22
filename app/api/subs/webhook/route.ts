import { getSubState, setSubState } from '@/lib/kv'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

const TRACKED_CHANNELS = ['mortedor', 'nanoide', 'melianvalen'] as const
type ChannelKey = (typeof TRACKED_CHANNELS)[number]

const HANDLED_EVENTS = new Set([
  'channel.subscription.new',
  'channel.subscription.gifts',
  'channel.subscription.renewal',
])

type KickWebhookPayload = {
  type?: string
  event?: string
  data?: {
    broadcaster?: { slug?: string }
    channel?: { slug?: string }
    channel_slug?: string
    // gifts event includes a quantity field
    gifted_subscriptions?: unknown[]
    quantity?: number
  }
}

function extractChannelKey(payload: KickWebhookPayload): ChannelKey | null {
  const slug =
    payload.data?.broadcaster?.slug ??
    payload.data?.channel?.slug ??
    payload.data?.channel_slug ??
    null

  if (!slug) return null
  const normalized = slug.toLowerCase() as ChannelKey
  return TRACKED_CHANNELS.includes(normalized) ? normalized : null
}

// For gifts, Kick sends one event with a quantity — count each gift as one sub
function extractCount(eventType: string, payload: KickWebhookPayload): number {
  if (eventType === 'channel.subscription.gifts') {
    return (
      payload.data?.gifted_subscriptions?.length ??
      payload.data?.quantity ??
      1
    )
  }
  return 1
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as KickWebhookPayload

  const eventType = payload.type ?? payload.event ?? ''
  if (!HANDLED_EVENTS.has(eventType)) {
    return NextResponse.json({ ok: true, skipped: true })
  }

  const channelKey = extractChannelKey(payload)
  if (!channelKey) {
    console.warn('[subs/webhook] Could not identify channel:', JSON.stringify(payload))
    return NextResponse.json({ ok: true, skipped: true })
  }

  const count = extractCount(eventType, payload)
  const state = await getSubState()
  state.byChannel[channelKey] += count
  state.total += count
  await setSubState(state)

  return NextResponse.json({ ok: true, channel: channelKey, count, total: state.total })
}
