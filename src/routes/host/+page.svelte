<script lang="ts">
import SongItem from '$lib/components/SongItem.svelte'
import { Participants, Songs } from '$lib/db'
import { P2PHost } from '$lib/p2p'

let roomId = 'test' // TODO: generate unique room ID and display to user 

const p2p = new P2PHost(roomId)

let queue = $derived(
  Songs.find({})
    .fetch()
    .sort((a, b) => b.score - a.score),
)

let participants = $derived(
  Participants.find({ id: { $in: p2p.clientIds } }).fetch(),
)
</script>

<h3>Host Jukebox</h3>

<p>Room: <strong>{roomId}</strong> &mdash; Status: {p2p.status}</p>

<section>
  <h4>Participants ({participants.length})</h4>
  {#if participants.length === 0}
    <p>No participants connected yet.</p>
  {:else}
    <ul>
      {#each participants as participant (participant.id)}
        <li>
          {participant.name}
          <button onclick={() => p2p.kickParticipant(participant.id)}>
            Kick
          </button>
        </li>
      {/each}
    </ul>
  {/if}
</section>

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
