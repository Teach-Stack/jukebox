// Mints short-lived Cloudflare TURN credentials so the API token never reaches the browser
export default {
  async fetch(request, env) {
    if (new URL(request.url).pathname !== '/api/turn') {
      return env.ASSETS.fetch(request)
    }

    const res = await fetch(
      `https://rtc.live.cloudflare.com/v1/turn/keys/${env.TURN_KEY_ID}/credentials/generate-ice-servers`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${env.TURN_KEY_API_TOKEN}`,
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
  },
}
