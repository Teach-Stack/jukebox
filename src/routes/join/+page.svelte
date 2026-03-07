<script lang="ts">
import SongItem from '$lib/components/SongItem.svelte'
import { P2PClient } from '$lib/p2p'

const p2p = new P2PClient()

const MOCK_SONGS = [
  {
    youtubeId: 'dQw4w9WgXcQ',
    title: 'Never Gonna Give You Up',
    artist: 'Rick Astley',
    thumbnailUrl: 'https://img.youtube.com/vi/dQw4w9WgXcQ/default.jpg',
    duration: 213,
  },
  {
    id: '2',
    youtubeId: '3JZ_D3ELwOQ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    duration: 354,
    thumbnailUrl: 'https://img.youtube.com/vi/3JZ_D3ELwOQ/default.jpg',
  },
]
</script>

<h3>Join Jukebox</h3>

<pre>
  Peer Status      : {p2p.peerStatus}
  Peer ID          : {p2p.peerId}
  Connection Status: {p2p.connectionStatus}
</pre>

{#if p2p.kicked}
  <p>You have been removed from the room.</p>
{/if}

{#if p2p.peerStatus === 'error'}
  <p>Error: {p2p.peerError}</p>
{/if}

{#if p2p.connectionStatus === 'connected'}
  <p>Connected to Room {p2p.hostId}</p>

  <section>
    <button
      type="button"
      onclick={() => p2p.submitSong(MOCK_SONGS[Math.floor(Math.random() * MOCK_SONGS.length)])}
    >
      Submit Mock Song
    </button>
  </section>

  <section>
    <h4>Current Queue</h4>
    {#if p2p.songs.length === 0}
      <p>No songs in queue yet</p>
    {:else}
      <ol>
        {#each p2p.songs as song (song.id)}
          <li><SongItem {song} /></li>
        {/each}
      </ol>
    {/if}
  </section>
{:else}
  <form onsubmit={(e) => { e.preventDefault(); p2p.connect(); }}>
    <label>
      Room code
      <input type="text" placeholder="Room code" bind:value={p2p.hostId}>
    </label>
    <label>
      Your name
      <input type="text" placeholder="Your name" bind:value={p2p.name}>
    </label>
    <button type="submit" disabled={p2p.peerStatus !== 'ready'}>Join Room</button>
  </form>
{/if}
