<script lang="ts">
import SongItem from '$lib/components/SongItem.svelte'
import { Songs } from '$lib/db'
import { P2PHost } from '$lib/p2p'

let roomId = 'jukebox-room'

const p2p = new P2PHost(roomId)

let queue = $derived(
  Songs.find({})
    .fetch()
    .sort((a, b) => b.score - a.score),
)
</script>

<h3>Host Jukebox</h3>

<pre>
  Status  : {p2p.status}
  ROOM    : {roomId}
  Clients : {p2p.clientIds.join(', ')}
  Songs   : {queue.length}
</pre>

<section>
  <h4>Current Queue</h4>
  {#if queue.length === 0}
    <p>No songs in queue yet. Waiting for participants to add songs...</p>
  {:else}
    <ol>
      {#each queue as song (song.id)}
        <li><SongItem {song} onRemove={() => p2p.removeSong(song.id)} /></li>
      {/each}
    </ol>
  {/if}
</section>
