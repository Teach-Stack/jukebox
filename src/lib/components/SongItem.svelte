<script lang="ts">
import type { Song } from '$lib/db'
import { formatDuration } from '$lib/helpers/format'

interface Props {
  song: Song
  onRemove?: () => void
}

let { song, onRemove }: Props = $props()
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
    <dd>{song.score}</dd>
    <dt>Status</dt>
    <dd>{song.status}</dd>
  </dl>
  {#if onRemove && song.status === 'queued'}
    <button type="button" onclick={onRemove}>Remove</button>
  {/if}
</article>
