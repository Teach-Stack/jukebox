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
  <img
    src={song.thumbnailUrl}
    alt="{song.title} thumbnail"
    width="120"
    height="90"
  >
  <h4>{song.title}</h4>
  <p>{song.artist}</p>
  <dl>
    <dt>Duration</dt>
    <dd>{formatDuration(song.duration)}</dd>
    <dt>Added by</dt>
    <dd>{song.addedBy?.name}</dd>
    <dt>Score</dt>
    <dd>
      {song.score}
      {#if onUpvote && onDownvote}
        <button
          type="button"
          onclick={() => onUpvote?.(song.id)}
          disabled={votingDisabled}
          title={votingDisabled ? getDisabledTitle() : 'Upvote song'}
          aria-label="Upvote song"
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
          class:active={downvoteActive}
        >
          ↓
        </button>
      {/if}
    </dd>
    <dt>Status</dt>
    <dd>{song.status}</dd>
  </dl>
  {#if onRemove && song.status === 'queued'}
    <button type="button" onclick={onRemove}>Remove</button>
  {/if}
</article>
