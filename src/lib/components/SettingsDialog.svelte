<script lang="ts">
import { Sessions } from '$lib/db'
import { formatDuration } from '$lib/helpers/format'
import { searchYouTube, type YouTubeSearchResult } from '$lib/helpers/youtube'

import CloseOutline from '~icons/teenyicons/x-outline'

interface Props {
  sessionId: string
}

let { sessionId }: Props = $props()

let dialogRef: HTMLDialogElement | null = $state(null)
let searchQuery = $state('')
let searchState: 'idle' | 'loading' | 'results' | 'error' | 'empty' =
  $state('idle')
let searchResults: YouTubeSearchResult[] = $state([])
let errorMessage = $state('')

const session = $derived(Sessions.findOne({ id: sessionId }))
const currentDefault = $derived(session?.defaultVideo)

export function open() {
  dialogRef?.showModal()
}

export function close() {
  dialogRef?.close()
  // Reset search state when closing
  searchQuery = ''
  searchResults = []
  searchState = 'idle'
  errorMessage = ''
}

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

function handleSetDefault(result: YouTubeSearchResult) {
  Sessions.updateOne(
    { id: sessionId },
    {
      $set: {
        defaultVideo: {
          youtubeId: result.youtubeId,
          title: result.title,
          artist: result.artist,
          thumbnailUrl: result.thumbnailUrl,
          duration: result.duration,
        },
      },
    },
  )
  close()
}

function handleClearDefault() {
  Sessions.updateOne({ id: sessionId }, { $unset: { defaultVideo: true } })
}

function handleDialogClick(e: MouseEvent) {
  // Close dialog when clicking on the backdrop (outside the dialog content)
  if (e.target === dialogRef) {
    close()
  }
}
</script>

<dialog bind:this={dialogRef} onclick={handleDialogClick}>
  <div class="dialog-header">
    <h5>Settings</h5>
    <button
      type="button"
      class="sm"
      onclick={close}
      aria-label="Close settings"
    >
      <CloseOutline />
    </button>
  </div>

  <div class="dialog-content stack">
    <section class="stack">
      <h6>Default Video</h6>
      <p class="hint">
        Set a default video to play when the queue is empty. It will loop until
        participants add songs.
      </p>

      {#if currentDefault}
        <div class="current-default">
          <img
            src={currentDefault.thumbnailUrl}
            alt={currentDefault.title}
            class="thumbnail"
          >
          <div class="info">
            <p class="title">{currentDefault.title}</p>
            <p class="artist">{currentDefault.artist}</p>
            <p class="duration">{formatDuration(currentDefault.duration)}</p>
          </div>
          <button type="button" class="error sm" onclick={handleClearDefault}>
            Clear
          </button>
        </div>
      {:else}
        <p class="muted">No default video set</p>
      {/if}
    </section>

    <hr>

    <section class="stack">
      <h6>Search for Default Video</h6>
      <form class="search-form" onsubmit={handleSearch}>
        <input
          type="text"
          placeholder="Search YouTube..."
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
                class="sm primary"
                onclick={() => handleSetDefault(result)}
              >
                Set Default
              </button>
            </div>
          {/each}
        </div>
      {/if}
    </section>
  </div>
</dialog>

<style>
dialog {
  max-width: 600px;
  width: 90vw;
  max-height: 80vh;
  border-radius: var(--br-m);
  border: var(--border-1);
  border-color: var(--slate-4);
  padding: 0;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--pad-m);
  border-bottom: 1px solid var(--slate-3);
}

.dialog-header h5 {
  margin: 0;
}

.dialog-content {
  padding: var(--pad-m);
  overflow-y: auto;
  max-height: calc(80vh - 60px);
}

.hint {
  font-size: 0.875rem;
  color: var(--slate-6);
  margin: 0;
}

.muted {
  color: var(--slate-5);
  font-size: 0.875rem;
  margin: 0;
}

hr {
  border: none;
  border-top: 1px solid var(--slate-3);
  margin-block: var(--pad-m);
}

/* Current default video display */
.current-default {
  display: flex;
  align-items: center;
  gap: var(--pad-m);
  padding: var(--pad-s);
  border: var(--border-1);
  border-color: var(--slate-3);
  border-radius: var(--br-s);
  background-color: var(--slate-1);
}

.current-default .thumbnail {
  width: 120px;
  height: 90px;
  object-fit: cover;
  border-radius: var(--br-xs);
  flex-shrink: 0;
}

.current-default .info {
  flex: 1;
  min-width: 0;
}

.current-default .title {
  font-weight: bold;
  margin: 0;
  font-size: 0.95rem;
  line-height: var(--lh-s);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-default .artist {
  color: var(--slate-7);
  font-size: 0.85rem;
  line-height: var(--lh-xs);
  margin: var(--pad-xs) 0 0 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.current-default .duration {
  color: var(--slate-6);
  font-size: 0.8rem;
  margin: var(--pad-xs) 0 0 0;
  font-family: monospace;
}

/* Search form */
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

/* Search results */
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

.result-item .thumbnail {
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
