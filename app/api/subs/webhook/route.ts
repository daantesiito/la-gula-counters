// POST endpoint — receives Kick webhook events for subscription creation.
//
// TODO: Add Kick webhook signature verification using the secret stored in
// the KICK_WEBHOOK_SECRET environment variable once Kick publishes documentation
// for their signing mechanism.
//
// Event type handled: channel.subscription.created
// See: https://docs.kick.com/events/event-types#channel-subscription-created

import { getSubState, setSubState } from '@/lib/kv'
import { NextRequest, NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Channel keys we track — must match the slugs Kick uses
const TRACKED_CHANNELS = ['mortedor', 'nanoide', 'melianvalen'] as const
type ChannelKey = (typeof TRACKED_CHANNELS)[number]

// Kick webhook payload shape (best-effort; adapt if their schema changes)
type KickWebhookPayload = {
  // Kick may use either field for the event type
  type?: string
  event?: string
  data?: {
    broadcaster?: {
      slug?: string
    }
    channel?: {
      slug?: string
    }
    // Some payload versions embed the slug at the top of data
    channel_slug?: string
    subscription_metadata?: {
      channel_slug?: string
    }
  }
}

function extractChannelKey(payload: KickWebhookPayload): ChannelKey | null {
  const slug =
    payload.data?.broadcaster?.slug ??
    payload.data?.channel?.slug ??
    payload.data?.channel_slug ??
    payload.data?.subscription_metadata?.channel_slug ??
    null

  if (!slug) return null

  const normalized = slug.toLowerCase() as ChannelKey
  return TRACKED_CHANNELS.includes(normalized) ? normalized : null
}

export async function POST(request: NextRequest) {
  const payload = (await request.json()) as KickWebhookPayload

  const eventType = payload.type ?? payload.event
  if (eventType !== 'channel.subscription.created') {
    // Acknowledge unknown event types silently
    return NextResponse.json({ ok: true, skipped: true })
  }

  const channelKey = extractChannelKey(payload)
  if (!channelKey) {
    console.warn(
      '[subs/webhook] Could not identify channel from payload:',
      JSON.stringify(payload)
    )
    return NextResponse.json({ ok: true, skipped: true })
  }

  const state = await getSubState()
  state.byChannel[channelKey] += 1
  state.total += 1
  await setSubState(state)

  return NextResponse.json({ ok: true, channel: channelKey, total: state.total })
}
