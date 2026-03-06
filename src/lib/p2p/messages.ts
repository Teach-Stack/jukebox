import { type } from 'arktype'
import { Song } from '$lib/db'

const PeerNameMessage = type({
  type: "'PEER_NAME'",
  payload: {
    name: 'string',
  },
})

const CurrentQueueMessage = type({
  type: "'CURRENT_QUEUE'",
  payload: {
    songs: type.instanceOf(Song).array(),
  },
})

export const P2PMessage = type.or(PeerNameMessage, CurrentQueueMessage)

export type P2PMessage = typeof P2PMessage.infer
export type MessageType = P2PMessage['type']
