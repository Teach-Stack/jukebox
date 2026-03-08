<script lang="ts">
import { formatDuration } from '$lib/helpers/format'
import type { SongInQueue } from '$lib/p2p/messages'

interface Props {
  onRemove?: () => void
  onUpvote?: (songId: string) => void
  onDownvote?: (songId: string) => void
  currentUserVote?: 'up' | 'down' | null
  isOwnSong?: boolean
  canVote?: boolean
  song: SongInQueue
}

let {
  song,
  onRemove,
  onUpvote,
  onDownvote,
  currentUserVote = null,
  isOwnSong = false,
  canVote = true,
}: Props = $props()

const hasVoted = $derived(currentUserVote !== null)
const votingDisabled = $derived(isOwnSong || !canVote || hasVoted)
const upvoteActive = $derived(currentUserVote === 'up')
const downvoteActive = $derived(currentUserVote === 'down')

function getDisabledTitle(): string {
  if (isOwnSong) return 'You cannot vote on your own song'
  if (!canVote) return 'Voting is only available for queued songs'
  if (hasVoted) return 'You have already voted on this song'
  return ''
}
</script>

<article>
  <img src={song.thumbnailUrl} alt="{song.title} thumbnail" width="96">
  <div class="content">
    <h4>{song.title}</h4>
    <p>{song.artist}</p>
    <dl>
      <dt>Duration</dt>
      <dd>{formatDuration(song.duration)}</dd>
      <dt>Added by</dt>
      <dd>{song.addedBy?.name}</dd>
      <dt>Score</dt>
      <dd>{song.score}</dd>
    </dl>
  </div>
  <div>
    {#if onUpvote && onDownvote}
      <button
        type="button"
        onclick={() => onUpvote?.(song.id)}
        disabled={votingDisabled}
        title={votingDisabled ? getDisabledTitle() : 'Upvote song'}
        aria-label="Upvote song"
        class="sm"
        class:active={upvoteActive}
      >
        ↑
      </button>
      <button
        type="button"
        onclick={() => onDownvote?.(song.id)}
        disabled={votingDisabled}
        title={votingDisabled ? getDisabledTitle() : 'Downvote song'}
        aria-label="Downvote song"
        class="sm"
        class:active={downvoteActive}
      >
        ↓
      </button>
    {/if}
    {#if onRemove && song.status === 'queued'}
      <button type="button" class="error sm" onclick={onRemove}>Remove</button>
    {/if}
  </div>
</article>

<style>
article {
  display: flex;
  gap: var(--pad-m);
  padding: var(--pad-s) var(--pad-m);
  border-radius: var(--br-s);
  border: 1px solid var(--slate-3);
  align-items: center;
}

img {
  border-radius: var(--br-xs);
  flex-shrink: 0;
  object-fit: cover;
}

.content {
  display: flex;
  flex-direction: column;
  gap: var(--pad-xs);
  flex: 1;
  min-width: 0;
}

h4 {
  margin: 0;
  font-size: 1rem;
  line-height: var(--lh-s);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

p {
  margin: 0;
  color: var(--slate-7);
  font-size: 0.875rem;
  line-height: var(--lh-xs);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

dl {
  display: flex;
  gap: var(--pad-m);
  font-size: 0.75rem;
  margin: 0;
  line-height: var(--lh-xs);
  flex-wrap: wrap;
  align-items: center;
}

dt {
  font-weight: 600;
  color: var(--slate-7);
}

dd {
  margin: 0;
  display: flex;
  gap: var(--pad-xs);
  align-items: center;
}

dd::before {
  content: ": ";
}
</style>
