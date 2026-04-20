# La Gula Counters

OBS-readable overlays and a moderator control panel for La Gula streams.
Built with Next.js 14 App Router, Vercel KV (Redis), and Server-Sent Events.

---

## URLs

| Path | Purpose |
|---|---|
| `/control` | Moderator control panel |
| `/overlay/timer` | OBS browser source — countdown timer (400 × 150 px) |
| `/overlay/subs` | OBS browser source — sub counter (400 × 200 px) |
| `/api/timer` | SSE stream of `TimerState` |
| `/api/subs` | SSE stream of `SubState` |
| `/api/timer/control` | POST — control the timer |
| `/api/subs/control` | POST — reset / manual add subs |
| `/api/subs/webhook` | POST — Kick webhook receiver |

---

## Local Development

```bash
npm install

# Pull KV credentials from your linked Vercel project
vercel env pull .env.local

# Start dev server
vercel dev
# or: npm run dev (KV will not work without the env vars above)
```

---

## Environment Variables

These are auto-injected by Vercel when you link a KV store. For local dev,
run `vercel env pull .env.local` after linking the store.

| Variable | Description |
|---|---|
| `KV_URL` | Vercel KV connection URL |
| `KV_REST_API_URL` | Vercel KV REST API URL |
| `KV_REST_API_TOKEN` | Vercel KV REST API token (read/write) |
| `KV_REST_API_READ_ONLY_TOKEN` | Vercel KV REST API token (read-only) |
| `KICK_WEBHOOK_SECRET` | Future: Kick webhook signature verification secret |

---

## Deployment

### 1. Create a Vercel KV store

In the [Vercel dashboard](https://vercel.com/dashboard):
1. Open your project → **Storage** → **Connect Store** → **KV**.
2. Create a new store (or connect an existing one).
3. Environment variables are injected automatically into your deployments.

### 2. Deploy

```bash
vercel deploy
```

### 3. Register Kick webhooks

For each channel (Mortedor, Nanoide, Melianvalen), register a webhook in the
Kick developer dashboard pointing to:

```
https://your-domain.vercel.app/api/subs/webhook
```

Event type: `channel.subscription.created`

> **Note:** Kick webhook signature verification is not yet implemented.
> See `app/api/subs/webhook/route.ts` for the TODO comment. Once Kick
> publishes signing documentation, add HMAC verification there using the
> `KICK_WEBHOOK_SECRET` environment variable.

---

## OBS Setup

Add two **Browser Sources** in OBS:

| Source | URL | Width | Height |
|---|---|---|---|
| Timer | `https://your-domain.vercel.app/overlay/timer` | 400 | 150 |
| Subs | `https://your-domain.vercel.app/overlay/subs` | 400 | 200 |

Recommended OBS browser source settings:
- **Custom CSS:** *(leave empty — the page handles its own styles)*
- **Shutdown source when not visible:** ✓ (reduces idle connections)
- **Refresh browser when scene becomes active:** ✓

---

## Architecture Notes

- **SSE + KV polling:** Vercel serverless/edge functions don't support WebSockets.
  Each SSE endpoint polls KV every 500 ms (timer) or 1000 ms (subs) and streams
  state to clients. The timer overlay interpolates smoothly between updates with a
  client-side 100 ms tick.
- **Edge Runtime:** SSE routes run on Vercel's Edge Runtime for lower latency and
  built-in streaming support. `@vercel/kv` uses `fetch` internally and is fully
  compatible with Edge.
- **Auto-reconnect:** Vercel edge functions have a 30-second execution limit.
  The `EventSource` API (used in all client pages) automatically reconnects after
  3 seconds (`retry: 3000`) when a stream ends. The timer display continues
  counting down locally during the brief reconnect gap.
# la-gula-counters
