// Falls back to PeerJS defaults when /api/turn is unavailable (e.g. `vite dev`)
export const iceServers: RTCIceServer[] | undefined = await fetch('/api/turn')
  .then((res) => (res.ok ? res.json() : undefined))
  .then((data) => data?.iceServers)
  .catch(() => undefined)

export const peerOptions = {
  debug: 2,
  ...(iceServers && { config: { iceServers } }),
}
