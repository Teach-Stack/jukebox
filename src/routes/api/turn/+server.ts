import { TURN_KEY_API_TOKEN, TURN_KEY_ID } from '$app/env/private'

export const prerender = false

// Mints short-lived Cloudflare TURN credentials so the API token never reaches the browser
export async function GET() {
  const res = await fetch(
    `https://rtc.live.cloudflare.com/v1/turn/keys/${TURN_KEY_ID}/credentials/generate-ice-servers`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${TURN_KEY_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ ttl: 86400 }),
    },
  )

  return new Response(res.body, {
    status: res.status,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
    },
  })
}
