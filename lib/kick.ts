// Kick API helpers — OAuth 2.0 client credentials + webhook subscription

const KICK_TOKEN_URL = 'https://id.kick.com/oauth/token'
const KICK_API_BASE = 'https://api.kick.com/public/v1'

// ---------------------------------------------------------------------------
// OAuth
// ---------------------------------------------------------------------------

export async function getKickAccessToken(): Promise<string> {
  const res = await fetch(KICK_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: process.env.KICK_CLIENT_ID!,
      client_secret: process.env.KICK_CLIENT_SECRET!,
    }),
  })

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Kick token error ${res.status}: ${text}`)
  }

  const data = (await res.json()) as { access_token: string }
  return data.access_token
}

// ---------------------------------------------------------------------------
// Channel info
// ---------------------------------------------------------------------------

export type KickChannel = {
  broadcaster_user_id: number
  broadcaster_username: string
  slug: string
}

export async function getKickChannel(
  slug: string,
  token: string
): Promise<KickChannel> {
  // Try fetching by broadcaster_username query param
  const res = await fetch(
    `${KICK_API_BASE}/channels?broadcaster_username=${encodeURIComponent(slug)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  )

  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Kick channel lookup error ${res.status} for "${slug}": ${text}`)
  }

  const data = (await res.json()) as { data: KickChannel[] }
  const channel = data.data?.[0]
  if (!channel) throw new Error(`Channel not found: ${slug}`)
  return channel
}

// ---------------------------------------------------------------------------
// Webhook subscription
// ---------------------------------------------------------------------------

export type WebhookSubscribeResult = {
  slug: string
  broadcaster_user_id: number
  status: number
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  response: any
}

export async function subscribeWebhook(
  broadcasterId: number,
  slug: string,
  webhookUrl: string,
  token: string
): Promise<WebhookSubscribeResult> {
  const res = await fetch(`${KICK_API_BASE}/webhooks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      broadcaster_user_id: broadcasterId,
      events: [{ name: 'channel.subscription.created', version: 1 }],
      url: webhookUrl,
      // method: 'webhook', // uncomment if Kick requires this field
    }),
  })

  const response = await res.json().catch(() => null)
  return { slug, broadcaster_user_id: broadcasterId, status: res.status, response }
}
