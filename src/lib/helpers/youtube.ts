import { env } from '$env/dynamic/public'
import type { SubmittedSong } from '$lib/p2p/messages'

export interface YouTubeSearchResult {
  youtubeId: string
  title: string
  artist: string
  thumbnailUrl: string
  duration: number
}

interface YouTubeApiSearchItem {
  id: {
    videoId: string
  }
  snippet: {
    title: string
    channelTitle: string
    thumbnails: {
      medium: {
        url: string
      }
    }
  }
}

interface YouTubeApiVideoItem {
  id: string
  contentDetails: {
    duration: string
  }
}

/**
 * Decode HTML entities in strings (e.g., "&quot;" to ", "&amp;" to &)
 */
export function decodeHtmlEntities(text: string): string {
  const textarea = document.createElement('textarea')
  textarea.innerHTML = text
  return textarea.value
}

/**
 * Parse ISO 8601 duration format (e.g., "PT4M30S") to seconds
 */
export function parseDuration(isoDuration: string): number {
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/
  const matches = isoDuration.match(regex)

  if (!matches) {
    return 0
  }

  const hours = Number.parseInt(matches[1] || '0', 10)
  const minutes = Number.parseInt(matches[2] || '0', 10)
  const seconds = Number.parseInt(matches[3] || '0', 10)

  return hours * 3600 + minutes * 60 + seconds
}

/**
 * Search YouTube videos using the Data API v3
 * Returns up to 10 results with video information including duration
 */
export async function searchYouTube(
  query: string,
): Promise<YouTubeSearchResult[]> {
  const apiKey = env.PUBLIC_YOUTUBE_API_KEY

  if (!apiKey) {
    throw new Error(
      'YouTube API key not configured. Please add PUBLIC_YOUTUBE_API_KEY to your .env file.',
    )
  }

  if (!query || query.trim().length === 0) {
    throw new Error('Search query cannot be empty.')
  }

  try {
    // Step 1: Search for videos
    const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search')
    searchUrl.searchParams.set('part', 'snippet')
    searchUrl.searchParams.set('q', query.trim())
    searchUrl.searchParams.set('type', 'video')
    searchUrl.searchParams.set('maxResults', '10')
    searchUrl.searchParams.set('key', apiKey)
    searchUrl.searchParams.set('safeSearch', 'strict') // Filter out explicit content
    searchUrl.searchParams.set('topicId', '/m/04rlf') // Music category
    searchUrl.searchParams.set('videoEmbeddable', 'true') // Only return embeddable videos

    const searchResponse = await fetch(searchUrl.toString())

    if (!searchResponse.ok) {
      const errorData = await searchResponse.json().catch(() => ({}))
      const errorMessage =
        errorData.error?.message || `API error: ${searchResponse.status}`

      if (searchResponse.status === 403) {
        throw new Error(
          'YouTube API quota exceeded or invalid API key. Please check your API key and quota limits.',
        )
      }

      throw new Error(errorMessage)
    }

    const searchData = await searchResponse.json()
    const items: YouTubeApiSearchItem[] = searchData.items || []

    if (items.length === 0) {
      return []
    }

    // Step 2: Get video details (including duration) for all results
    const videoIds = items.map((item) => item.id.videoId).join(',')
    const videosUrl = new URL('https://www.googleapis.com/youtube/v3/videos')
    videosUrl.searchParams.set('part', 'contentDetails')
    videosUrl.searchParams.set('id', videoIds)
    videosUrl.searchParams.set('key', apiKey)

    const videosResponse = await fetch(videosUrl.toString())

    if (!videosResponse.ok) {
      throw new Error(`Failed to fetch video details: ${videosResponse.status}`)
    }

    const videosData = await videosResponse.json()
    const videoItems: YouTubeApiVideoItem[] = videosData.items || []

    // Create a map of video ID to duration
    const durationMap = new Map<string, number>()
    for (const video of videoItems) {
      durationMap.set(video.id, parseDuration(video.contentDetails.duration))
    }

    // Step 3: Combine search results with duration data
    const results: YouTubeSearchResult[] = items.map((item) => ({
      youtubeId: item.id.videoId,
      title: decodeHtmlEntities(item.snippet.title),
      artist: decodeHtmlEntities(item.snippet.channelTitle),
      thumbnailUrl: item.snippet.thumbnails.medium.url,
      duration: durationMap.get(item.id.videoId) || 0,
    }))

    return results
  } catch (error) {
    if (error instanceof Error) {
      throw error
    }
    throw new Error('An unexpected error occurred while searching YouTube.')
  }
}

/**
 * Convert a YouTubeSearchResult to a SubmittedSong for adding to the queue
 */
export function toSubmittedSong(result: YouTubeSearchResult): SubmittedSong {
  return {
    youtubeId: result.youtubeId,
    title: result.title,
    artist: result.artist,
    thumbnailUrl: result.thumbnailUrl,
    duration: result.duration,
  }
}
