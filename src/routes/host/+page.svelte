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
  Songs.find({ status: { $in: ['queued'] } })
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

<div class="layout-readable layout-sidebar invert wide">
  <header>
    <h4>Jukebox</h4>
  </header>

  <aside>
    <section>
      <p>Room: <strong>{roomId}</strong></p>
    </section>

    <section>
      <h6>Participants ({participants.length})</h6>
      {#if participants.length === 0}
        <p>No participants connected yet.</p>
      {:else}
        <div class="stack">
          {#each participants as participant (participant.id)}
            <div class="participant">
              {participant.name}
              <button
                type="button"
                class="sm"
                onclick={() => p2p.kickParticipant(participant.id)}
              >
                Kick
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </aside>

  <main class="stack">
    <section>
      <h4>Now Playing</h4>
      {#if currentSong}
        <YouTubePlayer
          bind:this={playerRef}
          song={currentSong}
          onEnded={handleSongEnded}
          onError={handlePlayerError}
          onSkip={skipSong}
        />
      {:else if nextSong}
        <p>No song currently playing.</p>
        <button type="button" onclick={playNext}>
          Start Playing: {nextSong.title}
        </button>
      {/if}
    </section>

    <section>
      <h5>Upcoming Songs</h5>
      {#if queue.length === 0}
        <p>No songs in queue yet. Waiting for participants to add songs...</p>
      {:else}
        <div class="stack">
          {#each queue as song}
            <SongItem
              {song}
              onRemove={() => p2p.removeSong(song.id)}
              canVote={song.status === 'queued'}
            />
          {/each}
        </div>
      {/if}
    </section>
  </main>
</div>

<style>
aside,
main {
  border: var(--border-1);
  border-color: var(--slate-4);
  background-color: #fff;
  padding: var(--pad-m);
  border-radius: var(--br-s);
  height: 100%;
}

.layout-sidebar.invert.wide {
  height: 100vh;
  padding: var(--pad-m);
  row-gap: 0;
  grid-template-rows: auto 1fr;
  grid-template-areas:
    "header header"
    "main aside";

  header {
    grid-area: header;
  }
  main {
    grid-area: main;
  }
  aside {
    grid-area: aside;
  }
}

.participant {
  display: flex;
  justify-content: space-between;
  align-items: center;
  border-bottom: 1px solid var(--slate-3);
  padding: var(--pad-xs);

  &:first-child {
    border-top: 1px solid var(--slate-3);
  }
}
</style>
