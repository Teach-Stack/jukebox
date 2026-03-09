<script lang="ts">
import { formatDuration } from '$lib/helpers/format'
import {
  searchYouTube,
  toSubmittedSong,
  type YouTubeSearchResult,
} from '$lib/helpers/youtube'
import type { SubmittedSong } from '$lib/p2p/messages'

interface Props {
  onSongSelect: (song: SubmittedSong) => void
}

let { onSongSelect }: Props = $props()

let searchQuery = $state('')
let searchState: 'idle' | 'loading' | 'results' | 'error' | 'empty' =
  $state('idle')
let searchResults: YouTubeSearchResult[] = $state([])
let errorMessage = $state('')

async function handleSearch(e: Event) {
  e.preventDefault()

  if (!searchQuery.trim()) {
    errorMessage = 'Please enter a search query'
    searchState = 'error'
    return
  }

  searchState = 'loading'
  errorMessage = ''
  searchResults = []

  try {
    const results = await searchYouTube(searchQuery)

    if (results.length === 0) {
      searchState = 'empty'
    } else {
      searchResults = results
      searchState = 'results'
    }
  } catch (error) {
    searchState = 'error'
    errorMessage =
      error instanceof Error ? error.message : 'An unexpected error occurred'
  }
}

function handleAddSong(result: YouTubeSearchResult) {
  const song = toSubmittedSong(result)
  onSongSelect(song)

  // Clear search after adding
  searchQuery = ''
  searchResults = []
  searchState = 'idle'
}
</script>

<div class="song-search stack">
  <form class="search-form" onsubmit={handleSearch}>
    <input
      type="text"
      placeholder="Search for songs..."
      bind:value={searchQuery}
      disabled={searchState === 'loading'}
    >
    <button
      type="submit"
      class="primary"
      disabled={searchState === 'loading' || !searchQuery.trim()}
    >
      {searchState === 'loading' ? 'Searching...' : 'Search'}
    </button>
  </form>

  {#if searchState === 'loading'}
    <div class="status-message">
      <p>Searching YouTube...</p>
    </div>
  {/if}

  {#if searchState === 'error'}
    <div class="alert error">
      <p><strong>Error:</strong> {errorMessage}</p>
    </div>
  {/if}

  {#if searchState === 'empty'}
    <div class="status-message">
      <p>No videos found for "{searchQuery}". Try a different search.</p>
    </div>
  {/if}

  {#if searchState === 'results' && searchResults.length > 0}
    <div class="results stack">
      {#each searchResults as result (result.youtubeId)}
        <div class="result-item">
          <img
            src={result.thumbnailUrl}
            alt={result.title}
            class="thumbnail"
            loading="lazy"
          >
          <div class="result-info">
            <p class="result-title">{result.title}</p>
            <p class="result-artist">{result.artist}</p>
            <p class="result-duration">{formatDuration(result.duration)}</p>
          </div>
          <button
            type="button"
            class="sm"
            onclick={() => handleAddSong(result)}
          >
            Add
          </button>
        </div>
      {/each}
    </div>
  {/if}
</div>

<style>
.song-search {
  width: 100%;
}

.search-form {
  display: flex;
  gap: var(--pad-s);
  width: 100%;
}

.search-form input {
  flex: 1;
  margin: 0;
}

.search-form button {
  white-space: nowrap;
}

.status-message {
  text-align: center;
  color: var(--slate-6);
  padding: var(--pad-m);
}

.results {
  margin-top: var(--pad-s);
}

.result-item {
  display: flex;
  align-items: center;
  gap: var(--pad-m);
  padding: var(--pad-s);
  border: var(--border-1);
  border-color: var(--slate-3);
  border-radius: var(--br-s);
  background-color: var(--slate-1);
}

.thumbnail {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: var(--br-xs);
  flex-shrink: 0;
}

.result-info {
  flex: 1;
  min-width: 0;
}

.result-title {
  font-weight: bold;
  margin: 0;
  font-size: 0.95rem;
  line-height: var(--lh-s);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-artist {
  color: var(--slate-7);
  font-size: 0.85rem;
  line-height: var(--lh-xs);
  margin: var(--pad-xs) 0 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.result-duration {
  color: var(--slate-6);
  font-size: 0.8rem;
  margin: var(--pad-xs) 0 0 0;
  font-family: monospace;
}
</style>
