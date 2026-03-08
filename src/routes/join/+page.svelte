<script lang="ts">
import SongItem from '$lib/components/SongItem.svelte'
import { getVote, saveVote } from '$lib/helpers/votes'
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
    youtubeId: '9bZkp7q19f0',
    title: 'Gangnam Style',
    artist: 'PSY',
    duration: 252,
    thumbnailUrl: 'https://img.youtube.com/vi/9bZkp7q19f0/default.jpg',
  },
  {
    youtubeId: 'kJQP7kiw5Fk',
    title: 'Despacito',
    artist: 'Luis Fonsi ft. Daddy Yankee',
    duration: 228,
    thumbnailUrl: 'https://img.youtube.com/vi/kJQP7kiw5Fk/default.jpg',
  },
  {
    youtubeId: 'fJ9rUzIMcZQ',
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    duration: 367,
    thumbnailUrl: 'https://img.youtube.com/vi/fJ9rUzIMcZQ/default.jpg',
  },
  {
    youtubeId: 'OPf0YbXqDm0',
    title: 'Uptown Funk',
    artist: 'Mark Ronson ft. Bruno Mars',
    duration: 269,
    thumbnailUrl: 'https://img.youtube.com/vi/OPf0YbXqDm0/default.jpg',
  },
  {
    youtubeId: 'RgKAFK5djSk',
    title: 'Waka Waka',
    artist: 'Shakira',
    duration: 214,
    thumbnailUrl: 'https://img.youtube.com/vi/RgKAFK5djSk/default.jpg',
  },
  {
    youtubeId: 'hTWKbfoikeg',
    title: 'Smells Like Teen Spirit',
    artist: 'Nirvana',
    duration: 301,
    thumbnailUrl: 'https://img.youtube.com/vi/hTWKbfoikeg/default.jpg',
  },
  {
    youtubeId: 'JGwWNGJdvx8',
    title: 'Shape of You',
    artist: 'Ed Sheeran',
    duration: 233,
    thumbnailUrl: 'https://img.youtube.com/vi/JGwWNGJdvx8/default.jpg',
  },
  {
    youtubeId: 'CevxZvSJLk8',
    title: 'Roar',
    artist: 'Katy Perry',
    duration: 223,
    thumbnailUrl: 'https://img.youtube.com/vi/CevxZvSJLk8/default.jpg',
  },
  {
    youtubeId: 'lDK9QqIzhwk',
    title: "Livin' On A Prayer",
    artist: 'Bon Jovi',
    duration: 249,
    thumbnailUrl: 'https://img.youtube.com/vi/lDK9QqIzhwk/default.jpg',
  },
  {
    youtubeId: 'pAgnJDJN4VA',
    title: 'All Star',
    artist: 'Smash Mouth',
    duration: 200,
    thumbnailUrl: 'https://img.youtube.com/vi/pAgnJDJN4VA/default.jpg',
  },
]

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
  <form onsubmit={(e) => { e.preventDefault(); p2p.connect(); }}>
    <label>
      Room code
      <input type="text" placeholder="Room code" bind:value={p2p.hostId}>
    </label>
    <label>
      Your name
      <input type="text" placeholder="Your name" bind:value={p2p.name}>
    </label>
    <button type="submit" disabled={p2p.peerStatus !== 'ready'}>
      Join Room
    </button>
  </form>
{/if}
