<script lang="ts">
import { P2PClient } from '$lib/p2p'

const p2p = new P2PClient()
</script>

<h3>Join Jukebox</h3>

<pre>
  Status: {p2p.status}
  Peer ID: {p2p.peerId}
</pre>

{#if p2p.status === 'error'}
  <p class="error">Error: {p2p.errorMessage}</p>
{/if}

{#if p2p.status === 'connected'}
  <p>Connected to Room {p2p.hostId}</p>
{:else}
  <input type="text" placeholder="Room code" bind:value={p2p.hostId}>
  <input type="text" placeholder="Your name" bind:value={p2p.name}>
  <button onclick={() => p2p.connect()} disabled={p2p.status !== 'ready'}>Join Room</button>
{/if}
