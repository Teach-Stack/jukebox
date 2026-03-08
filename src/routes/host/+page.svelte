<script lang="ts">
import SongItem from '$lib/components/SongItem.svelte'
import YouTubePlayer from '$lib/components/YouTubePlayer.svelte'
import { Participants, Songs } from '$lib/db'
import { P2PHost } from '$lib/p2p'

let roomId = 'test' // TODO: generate unique room ID and display to user

const p2p = new P2PHost(roomId)

let playerRef: YouTubePlayer | null = $state(null)
let playbackStarted = $state(false) // Track if host has started playback

// Current playing song
let currentSong = $derived(Songs.findOne({ status: 'playing' }))

// Queue (filter out played songs)
let queue = $derived(
  Songs.find({ status: { $in: ['queued', 'playing'] } })
    .fetch()
    .sort((a, b) => b.score - a.score),
)

// Next song in queue
let nextSong = $derived(
  Songs.find({ status: 'queued' })
    .fetch()
    .sort((a, b) => b.score - a.score)[0],
)

let participants = $derived(Participants.find({}).fetch())

// Auto-play when songs are added after queue was empty
$effect(() => {
  if (playbackStarted && !currentSong && nextSong) {
    // Playback was started, queue became empty, and now there's a new song
    playNext()
  }
})

// Queue progression logic
function playNext() {
  // Mark current song as played if exists
  if (currentSong) {
    Songs.updateOne({ id: currentSong.id }, { $set: { status: 'played' } })
  }

  // Get next song and start playing
  if (nextSong) {
    Songs.updateOne({ id: nextSong.id }, { $set: { status: 'playing' } })
    playbackStarted = true // Mark that playback has been started
  }
  // If no next song, playback will auto-resume when songs are added (via $effect)

  // Notify clients of queue changes
  p2p.notifyQueueChange()
}

function handleSongEnded() {
  // Auto-play next song when current ends
  playNext()
}

function skipSong() {
  // Manual skip - same as song ending
  handleSongEnded()
}

function handlePlayerError(error: string) {
  // Show error to user, do NOT auto-skip
  console.error('Player error:', error)
  // Error already displayed in player component
}
</script>

<h3>Host Jukebox</h3>

<p>Room: <strong>{roomId}</strong> &mdash; Status: {p2p.status}</p>

<section>
  {#if currentSong}
    <div>
      <img
        src={currentSong.thumbnailUrl}
        alt={currentSong.title}
        width="120"
        height="90"
      >
      <div>
        <strong>{currentSong.title}</strong>
        <p>{currentSong.artist}</p>
        <p>Added by: {currentSong.addedBy?.name ?? 'Unknown'}</p>
      </div>
      <button type="button" onclick={skipSong}>Skip Song</button>
    </div>

    <YouTubePlayer
      bind:this={playerRef}
      youtubeId={currentSong.youtubeId}
      onEnded={handleSongEnded}
      onError={handlePlayerError}
    />
  {:else if nextSong}
    <p>No song currently playing.</p>
    <button type="button" onclick={playNext}>
      ▶ Start Playing: {nextSong.title}
    </button>
  {:else}
    <p>Queue is empty. Waiting for participants to add songs...</p>
  {/if}
</section>

<section>
  <h4>Participants ({participants.length})</h4>
  {#if participants.length === 0}
    <p>No participants connected yet.</p>
  {:else}
    <ul>
      {#each participants as participant (participant.id)}
        <li>
          {participant.name}
          <button
            type="button"
            onclick={() => p2p.kickParticipant(participant.id)}
          >
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
      {#each queue as song}
        <li>
          <SongItem
            {song}
            onRemove={() => p2p.removeSong(song.id)}
            canVote={song.status === 'queued'}
          />
        </li>
      {/each}
    </ol>
  {/if}
</section>
