import { type } from 'arktype'
import { SongType } from '$lib/db'

const PeerNameMessage = type({
  type: "'PEER_NAME'",
  payload: {
    name: 'string',
  },
})

const CurrentQueueMessage = type({
  type: "'CURRENT_QUEUE'",
  payload: {
    songs: SongType.and({ score: 'number' }).array(),
  },
})

export const SubmittedSong = SongType.pick(
  'youtubeId',
  'title',
  'artist',
  'duration',
  'thumbnailUrl',
)

export type SubmittedSong = typeof SubmittedSong.infer

const AddSongMessage = type({
  type: "'ADD_SONG'",
  payload: {
    song: SubmittedSong,
  },
})

const FeedbackMessage = type({
  type: "'FEEDBACK'",
  payload: {
    message: 'string',
    level: "('info' | 'warning' | 'error') = 'info'",
  },
})

export const P2PMessage = type.or(
  PeerNameMessage,
  CurrentQueueMessage,
  AddSongMessage,
  FeedbackMessage,
)

export type P2PMessage = typeof P2PMessage.infer
export type MessageType = P2PMessage['type']
