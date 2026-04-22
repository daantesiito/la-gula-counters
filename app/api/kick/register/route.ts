// GET /api/kick/register?secret=KICK_REGISTER_SECRET
//
// Llama este endpoint UNA VEZ después de desplegar para registrar los
// webhooks de suscripción en los 3 canales de Kick.
//
// Protegido por el query param `secret` (debe coincidir con KICK_REGISTER_SECRET
// en las env vars). Así no queda expuesto públicamente.

import { NextRequest, NextResponse } from 'next/server'
import {
  getKickAccessToken,
  getKickChannel,
  subscribeWebhook,
} from '@/lib/kick'

export const dynamic = 'force-dynamic'

const CHANNELS = ['mortedor', 'nanoide', 'melianvalen']

export async function GET(request: NextRequest) {
  // Simple secret gate
  const secret = request.nextUrl.searchParams.get('secret')
  if (!secret || secret !== process.env.KICK_REGISTER_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let token: string
  try {
    token = await getKickAccessToken()
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 502 })
  }

  const results = []

  for (const slug of CHANNELS) {
    try {
      const channel = await getKickChannel(slug, token)
      const result = await subscribeWebhook(
        channel.broadcaster_user_id,
        slug,
        token
      )
      results.push({ ok: result.status < 300, ...result })
    } catch (err) {
      results.push({ ok: false, slug, error: String(err) })
    }
  }

  return NextResponse.json({ results })
}
