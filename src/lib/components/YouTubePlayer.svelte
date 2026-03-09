<script module lang="ts">
import { createLogger } from '$lib'

const logger = createLogger('YouTubePlayer')

export class YouTubePlayerState {
  player: YT.Player | null = $state(null)
  playerState:
    | 'uninitialized'
    | 'loading'
    | 'ready'
    | 'playing'
    | 'paused'
    | 'ended'
    | 'error' = $state('uninitialized')
  errorMessage: string = $state('')
  currentTime: number = $state(0)
  duration: number = $state(0)
  volume: number = $state(50)
  isPlayerReady: boolean = $state(false)

  private timeUpdateInterval: number | null = null
  private onEndedCallback?: () => void
  private pendingVideoId: string | null = null

  async initialize(elementId: string, onEnded?: () => void): Promise<void> {
    logger.start('Initializing YouTube player with element ID:', elementId)
    this.onEndedCallback = onEnded
    this.playerState = 'loading'

    // Load YouTube API script if not present
    if (!window.YT) {
      logger.debug('YouTube API not loaded, loading script...')
      await this.loadYouTubeAPI()
      logger.success('YouTube API script loaded')
    } else {
      logger.debug('YouTube API already loaded')
    }

    // Create player when API is ready
    const ytWindow = window as Window & { YT?: typeof YT & { loaded?: number } }
    if (typeof YT !== 'undefined' && ytWindow.YT?.loaded === 1) {
      logger.debug('YouTube API ready, creating player immediately')
      this.createPlayer(elementId)
    } else {
      logger.debug('Waiting for YouTube API to be ready...')
      const win = window as Window & { onYouTubeIframeAPIReady?: () => void }
      win.onYouTubeIframeAPIReady = () => {
        logger.debug('YouTube API ready callback fired')
        this.createPlayer(elementId)
      }
    }
  }

  private async loadYouTubeAPI(): Promise<void> {
    logger.debug('Injecting YouTube iframe API script')
    return new Promise((resolve) => {
      const tag = document.createElement('script')
      tag.src = 'https://www.youtube.com/iframe_api'
      tag.onload = () => {
        logger.debug('YouTube API script tag loaded')
        resolve()
      }
      tag.onerror = () => {
        logger.error('Failed to load YouTube API script')
        resolve() // Still resolve to prevent hanging
      }
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag)
    })
  }

  private createPlayer(elementId: string): void {
    logger.debug('Creating YT.Player instance with element:', elementId)
    try {
      this.player = new YT.Player(elementId, {
        height: '113',
        width: '200',
        playerVars: {
          autoplay: 0,
          controls: 0, // Hide native YouTube controls
          modestbranding: 1,
          showinfo: 0,
          rel: 0,
          fs: 1,
          iv_load_policy: 3,
        },
        events: {
          onReady: (event) => this.handleReady(event),
          onStateChange: (event) => this.handleStateChange(event),
          onError: (event) => this.handleError(event),
        },
      })
      logger.success('YT.Player instance created successfully')
    } catch (error) {
      logger.error('Failed to create YT.Player:', error)
      this.playerState = 'error'
      this.errorMessage = 'Failed to create player'
    }
  }

  private handleReady(event: YT.PlayerEvent): void {
    logger.ready('Player ready event fired')
    this.playerState = 'ready'
    this.isPlayerReady = true
    this.duration = this.player?.getDuration() ?? 0
    this.volume = this.player?.getVolume() ?? 50
    logger.debug('Player volume:', this.volume, 'Duration:', this.duration)

    // If there's a pending video ID, load it now
    if (this.pendingVideoId) {
      logger.debug('Loading pending video ID:', this.pendingVideoId)
      const videoId = this.pendingVideoId
      this.pendingVideoId = null
      this.loadVideo(videoId)
    } else {
      logger.debug('No pending video to load')
    }
  }

  private handleStateChange(event: YT.OnStateChangeEvent): void {
    const stateNames = {
      [YT.PlayerState.UNSTARTED]: 'UNSTARTED',
      [YT.PlayerState.ENDED]: 'ENDED',
      [YT.PlayerState.PLAYING]: 'PLAYING',
      [YT.PlayerState.PAUSED]: 'PAUSED',
      [YT.PlayerState.BUFFERING]: 'BUFFERING',
      [YT.PlayerState.CUED]: 'CUED',
    }
    logger.debug(
      'Player state changed to:',
      stateNames[event.data] || event.data,
    )

    switch (event.data) {
      case YT.PlayerState.UNSTARTED:
        this.playerState = 'ready'
        break
      case YT.PlayerState.PLAYING:
        this.playerState = 'playing'
        logger.success('Playback started')
        this.startTimeUpdate()
        break
      case YT.PlayerState.PAUSED:
        this.playerState = 'paused'
        logger.debug('Playback paused')
        this.stopTimeUpdate()
        break
      case YT.PlayerState.ENDED:
        this.playerState = 'ended'
        logger.success('Playback ended')
        this.stopTimeUpdate()
        this.onEndedCallback?.()
        break
      case YT.PlayerState.BUFFERING:
        logger.debug('Player buffering...')
        // Keep current state, just buffering
        break
    }
  }

  private handleError(event: YT.OnErrorEvent): void {
    logger.error('Player error occurred. Error code:', event.data)
    this.playerState = 'error'
    this.stopTimeUpdate()

    // Map error codes to user-friendly messages
    switch (event.data) {
      case 2:
        this.errorMessage = 'Invalid video ID'
        logger.error('Error: Invalid video ID')
        break
      case 5:
        this.errorMessage = 'Video player error (HTML5 issue)'
        logger.error('Error: HTML5 player issue')
        break
      case 100:
        this.errorMessage = 'Video not found or has been removed'
        logger.error('Error: Video not found (404)')
        break
      case 101:
      case 150:
        this.errorMessage = 'Video cannot be embedded (owner restriction)'
        logger.error('Error: Video embedding restricted by owner')
        break
      default:
        this.errorMessage = 'Unknown error occurred'
        logger.error('Error: Unknown error code:', event.data)
    }
  }

  private startTimeUpdate(): void {
    if (this.timeUpdateInterval) {
      logger.debug('Time update interval already running')
      return
    }

    logger.debug('Starting time update interval')
    this.timeUpdateInterval = window.setInterval(() => {
      if (this.player && this.playerState === 'playing') {
        this.currentTime = this.player.getCurrentTime()
        this.duration = this.player.getDuration()
      }
    }, 100) // Update every 100ms for smooth progress bar
  }

  private stopTimeUpdate(): void {
    if (this.timeUpdateInterval) {
      logger.debug('Stopping time update interval')
      clearInterval(this.timeUpdateInterval)
      this.timeUpdateInterval = null
    }
  }

  loadVideo(youtubeId: string): void {
    logger.debug('loadVideo called with ID:', youtubeId)

    if (!this.player) {
      logger.warn('Player not initialized yet, cannot load video')
      return
    }

    if (!this.isPlayerReady) {
      logger.warn('Player not ready yet, queuing video for later:', youtubeId)
      this.pendingVideoId = youtubeId
      return
    }

    // Check if loadVideoById exists on the player
    if (typeof this.player.loadVideoById !== 'function') {
      logger.error('loadVideoById is not a function!')
      logger.error('Player type:', typeof this.player)
      logger.error(
        'Player constructor:',
        this.player.constructor?.name || 'unknown',
      )
      logger.error('Available methods:', Object.keys(this.player))
      return
    }

    this.errorMessage = '' // Clear previous errors
    this.playerState = 'loading'
    logger.start('Loading video with autoplay:', youtubeId)
    try {
      this.player.loadVideoById({
        videoId: youtubeId,
        startSeconds: 0,
      })
      logger.success('loadVideoById called successfully with autoplay')
      // Start playing immediately
      this.player.playVideo()
    } catch (error) {
      logger.error('Error calling loadVideoById:', error)
      this.playerState = 'error'
      this.errorMessage = 'Failed to load video'
    }
  }

  play(): void {
    logger.debug('play() called')
    if (!this.player) {
      logger.warn('Cannot play: player not initialized')
      return
    }
    if (this.playerState === 'error') {
      logger.warn('Cannot play: player in error state')
      return
    }
    logger.debug('Calling playVideo()')
    this.player.playVideo()
  }

  pause(): void {
    logger.debug('pause() called')
    if (!this.player) {
      logger.warn('Cannot pause: player not initialized')
      return
    }
    logger.debug('Calling pauseVideo()')
    this.player.pauseVideo()
  }

  setVolume(level: number): void {
    logger.debug('setVolume() called with level:', level)
    if (!this.player) {
      logger.warn('Cannot set volume: player not initialized')
      return
    }
    this.volume = level
    this.player.setVolume(level)
  }

  seekTo(seconds: number): void {
    logger.debug('seekTo() called with seconds:', seconds)
    if (!this.player) {
      logger.warn('Cannot seek: player not initialized')
      return
    }
    this.player.seekTo(seconds, true)
  }

  destroy(): void {
    logger.debug('destroy() called - cleaning up player')
    this.stopTimeUpdate()
    if (this.player) {
      try {
        this.player.destroy()
        logger.success('Player destroyed successfully')
      } catch (error) {
        logger.error('Error destroying player:', error)
      }
    }
    this.player = null
    this.isPlayerReady = false
    this.pendingVideoId = null
    this.playerState = 'uninitialized'
  }
}
</script>

<script lang="ts">
import type { SongInQueue } from '$lib/p2p/messages'

import Pause from '~icons/teenyicons/pause-outline'
import Play from '~icons/teenyicons/play-outline'

interface Props {
  onEnded?: () => void
  onSkip?: () => void
  onError?: (error: string) => void
  song: SongInQueue
}

let { song, onEnded, onError, onSkip }: Props = $props()

const youtubeId = $derived(song.youtubeId)

const playerState = new YouTubePlayerState()
const playerElementId = 'youtube-player'

// Initialize on mount
$effect(() => {
  logger.debug('Component mounted, initializing player')
  playerState.initialize(playerElementId, onEnded)
  return () => {
    logger.debug('Component unmounting, destroying player')
    playerState.destroy()
  }
})

// Load video when youtubeId changes
$effect(() => {
  if (youtubeId) {
    logger.debug(
      'youtubeId changed to:',
      youtubeId,
      '| Player ready:',
      playerState.isPlayerReady,
    )
    if (playerState.isPlayerReady) {
      playerState.loadVideo(youtubeId)
    }
  } else {
    logger.debug('youtubeId is undefined/null')
  }
})

// Notify parent of errors
$effect(() => {
  if (playerState.errorMessage && onError) {
    logger.debug('Notifying parent of error:', playerState.errorMessage)
    onError(playerState.errorMessage)
  }
})

// Export methods for parent component
export function play() {
  playerState.play()
}
export function pause() {
  playerState.pause()
}
export function setVolume(level: number) {
  playerState.setVolume(level)
}
export function seekTo(seconds: number) {
  playerState.seekTo(seconds)
}

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function handleProgressInput(e: Event) {
  const target = e.currentTarget as HTMLInputElement
  seekTo(Number(target.value))
}

function handleVolumeInput(e: Event) {
  const target = e.currentTarget as HTMLInputElement
  setVolume(Number(target.value))
}

function togglePlayback() {
  if (playerState.playerState === 'playing') {
    pause()
  } else {
    play()
  }
}
</script>

<div class="youtube-player">
  <!-- YouTube iframe container -->
  <div id={playerElementId} class="player"></div>

  <!-- Error display -->
  {#if playerState.playerState === 'error'}
    <div class="error">
      <p><strong>Error:</strong> {playerState.errorMessage}</p>
    </div>
  {:else if playerState.playerState !== 'uninitialized'}
    <div class="info">
      <div>
        <p class="title">{song.title}</p>
        <p class="artist">{song.artist}</p>
      </div>
      <div class="controls">
        <button
          type="button"
          class="sm"
          onclick={togglePlayback}
          aria-label={playerState.playerState === 'playing' ? 'Pause' : 'Play'}
        >
          {#if playerState.playerState === 'playing'}
            <Pause />
          {:else}
            <Play />
          {/if}
        </button>
        <div class="progress">
          <input
            type="range"
            min="0"
            max={playerState.duration || 100}
            value={playerState.currentTime}
            oninput={handleProgressInput}
          >
          <div class="split">
            <span>{formatTime(playerState.currentTime)}</span>
            <span>{formatTime(playerState.duration)}</span>
          </div>
        </div>
      </div>
    </div>

    {#if onSkip}
      <button type="button" class="error sm" onclick={onSkip}>Skip</button>
    {/if}
  {/if}
</div>

<style>
.youtube-player {
  display: flex;
  align-items: center;
  gap: var(--pad-m);
}

.player {
  border-radius: var(--br-s);
}

.info {
  display: flex;
  flex: 1;
  flex-direction: column;
  justify-content: space-between;
  align-self: stretch;
}

.title {
  font-weight: bold;
  margin: 0;
  font-size: 1rem;
  line-height: var(--lh-s);
}
.artist {
  color: var(--slate-7);
  font-size: 0.875rem;
  line-height: var(--lh-xs);
}

.controls {
  display: flex;
  align-items: flex-start;
  gap: var(--pad-m);
  margin-top: var(--pad-s);
}

.progress {
  flex: 1;
  input[type="range"] {
    margin: 0;
  }
}
</style>
