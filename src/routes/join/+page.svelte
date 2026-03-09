<script lang="ts">
import { page } from '$app/stores'
import SongItem from '$lib/components/SongItem.svelte'
import SongSearch from '$lib/components/SongSearch.svelte'
import { getVote, saveVote } from '$lib/helpers/votes'
import { P2PClient } from '$lib/p2p'

const p2p = new P2PClient()

// Pre-populate room code from ?room= URL param
$effect(() => {
  const roomParam = $page.url.searchParams.get('room')
  if (roomParam && !p2p.hostId) {
    p2p.hostId = roomParam
  }
})

function handleUpvote(songId: string) {
  p2p.castVote(songId, 'up')
  saveVote(songId, 'up')
}

function handleDownvote(songId: string) {
  p2p.castVote(songId, 'down')
  saveVote(songId, 'down')
}

function getCurrentUserVote(songId: string): 'up' | 'down' | null {
  return getVote(songId)
}

function isOwnSong(song: (typeof p2p.songs)[number]): boolean {
  // Type system says addedById doesn't exist on SongInQueue but it's actually there at runtime
  const songWithId = song as typeof song & { addedById?: string }
  return songWithId.addedById === p2p.peerId
}
</script>

<div class="layout-readable center stack">
  <header>
    <h4>Jukebox</h4>
  </header>

  <main class="stack">
    {#if p2p.connectionStatus === 'connected'}
      <h4>Connected to room: {p2p.hostId}</h4>
    {:else}
      <h4>Join Room</h4>
    {/if}

    {#if p2p.kicked}
      <p class="alert warning">You have been removed from the room.</p>
    {/if}

    {#if p2p.peerStatus === 'error'}
      <p class="alert error">Error: {p2p.peerError}</p>
    {/if}

    {#if p2p.connectionStatus === 'connected'}
      <section class="stack">
        <h5>Add Songs</h5>
        <SongSearch onSongSelect={(song) => p2p.submitSong(song)} />
      </section>

      <section class="stack">
        <h5>Queue</h5>
        {#if p2p.songs.length === 0}
          <p>No songs in the queue yet.</p>
        {:else}
          <ol class="no-list stack">
            {#each p2p.songs as song (song.id)}
              <li>
                <SongItem
                  {song}
                  onUpvote={handleUpvote}
                  onDownvote={handleDownvote}
                  currentUserVote={getCurrentUserVote(song.id)}
                  isOwnSong={isOwnSong(song)}
                  canVote={song.status === 'queued'}
                />
              </li>
            {/each}
          </ol>
        {/if}
      </section>
    {:else}
      <form
        class="stack"
        onsubmit={(e) => { e.preventDefault(); p2p.connect(); }}
      >
        <label>
          Room code
          <input type="text" placeholder="Room code" bind:value={p2p.hostId}>
        </label>
        <label>
          Your name
          <input type="text" placeholder="Your name" bind:value={p2p.name}>
        </label>
        <button
          type="submit"
          class="primary block"
          disabled={p2p.peerStatus !== 'ready'}
        >
          Join Room
        </button>
      </form>
    {/if}
  </main>
</div>

<style>
main {
  border: var(--border-1);
  border-color: var(--slate-4);
  background-color: #fff;
  padding: var(--pad-m);
  border-radius: var(--br-s);
}
</style>
