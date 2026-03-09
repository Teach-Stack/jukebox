<script lang="ts">
import QRCode from 'qrcode'
import SongItem from '$lib/components/SongItem.svelte'
import YouTubePlayer from '$lib/components/YouTubePlayer.svelte'
import { Participants, Songs } from '$lib/db'
import { P2PHost } from '$lib/p2p'

// Generate a short unique room ID (6 alphanumeric chars)
function generateRoomId(): string {
  if (sessionStorage.getItem('jukebox:room-id')) {
    return sessionStorage.getItem('jukebox:room-id') as string
  }
  let newId = Math.random().toString(36).slice(2, 8).toUpperCase()
  sessionStorage.setItem('jukebox:room-id', newId)
  return newId
}

let roomId = generateRoomId()

const p2p = new P2PHost(roomId)

let playerRef: YouTubePlayer | null = $state(null)
let playbackStarted = $state(false)
let qrSvg = $state('')

// Build the join URL and generate QR code (client-side only)
$effect(() => {
  const joinUrl = `${window.location.origin}/join?room=${roomId}`
  QRCode.toString(joinUrl, {
    type: 'svg',
    margin: 1,
    color: { dark: '#0f172a', light: '#ffffff' },
  })
    .then((svg) => {
      qrSvg = svg
    })
    .catch(console.error)
})

let joinUrl = $derived(
  `${typeof window !== 'undefined' ? window.location.origin : ''}/join?room=${roomId}`,
)

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
    playNext()
  }
})

// Queue progression logic
function playNext() {
  if (currentSong) {
    Songs.updateOne({ id: currentSong.id }, { $set: { status: 'played' } })
  }

  if (nextSong) {
    Songs.updateOne({ id: nextSong.id }, { $set: { status: 'playing' } })
    playbackStarted = true
  }

  p2p.notifyQueueChange()
}

function handleSongEnded() {
  playNext()
}

function skipSong() {
  handleSongEnded()
}

function handlePlayerError(error: string) {
  console.error('Player error:', error)
}
</script>

<div class="layout-readable layout-sidebar invert wide">
  <header>
    <h4>Jukebox</h4>
  </header>

  <aside>
    <section class="join-section stack">
      <h6>Join this room</h6>

      {#if qrSvg}
        <div class="qr-wrapper">
          <!-- eslint-disable-next-line svelte/no-at-html-tags -->
          {@html qrSvg}
        </div>
      {/if}

      <div class="stack">
        <p class="join-hint">Scan the QR code or visit:</p>
        <code class="join-url">{joinUrl}</code>
      </div>

      <div class="room-code-block">
        <span class="room-code-label">Room code</span>
        <strong class="room-code">{roomId}</strong>
      </div>
    </section>

    <hr>

    <section class="stack">
      <h6>Participants ({participants.length})</h6>
      {#if participants.length === 0}
        <p class="muted">No one has joined yet.</p>
      {:else}
        <div class="stack">
          {#each participants as participant (participant.id)}
            <div class="participant">
              <span>{participant.name}</span>
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
        <button type="button" onclick={playNext}>Start The Queue</button>
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
  overflow-y: auto;
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

/* Join section */
.join-section {
  align-items: center;
  text-align: center;
}

.qr-wrapper {
  width: 100%;
  max-width: 200px;
  border-radius: var(--br-s);
  overflow: hidden;
  border: var(--border-1);
  border-color: var(--slate-3);

  :global(svg) {
    display: block;
    width: 100%;
    height: auto;
  }
}

.join-hint {
  font-size: 0.75rem;
  color: var(--slate-6);
  margin: 0;
}

.join-url {
  font-size: 0.7rem;
  word-break: break-all;
  background: var(--slate-1);
  padding: var(--pad-xs) var(--pad-s);
  border-radius: var(--br-xs);
  display: block;
}

.room-code-block {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--pad-xs);
  padding: var(--pad-s) var(--pad-m);
  background: var(--slate-1);
  border-radius: var(--br-s);
  border: 1px solid var(--slate-3);
  width: 100%;
}

.room-code-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--slate-6);
}

.room-code {
  font-size: 1.5rem;
  letter-spacing: 0.15em;
  font-family: monospace;
}

hr {
  border: none;
  border-top: 1px solid var(--slate-3);
  margin-block: var(--pad-m);
}

.muted {
  color: var(--slate-5);
  font-size: 0.875rem;
}

/* Participants */
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
