import { type } from 'arktype'
import { type DataConnection, Peer } from 'peerjs'

import { Participants, Songs, SongType } from '$lib/db'
import { type MessageType, P2PMessage, type SubmittedSong } from './messages'

type ConnectionStatus = 'disconnected' | 'ready' | 'error'

export class P2PHost {
  private peer: Peer
  private clients = $state<Record<string, DataConnection>>({})

  status = $state<ConnectionStatus>('disconnected')

  errorMessage = $state<string | null>(null)

  clientIds = $derived(Object.keys(this.clients))

  constructor(id: string) {
    this.peer = new Peer(id, { debug: 2 })

    this.peer.on('open', () => {
      console.debug('[P2PHost] Peer opened with ID:', this.peer.id)
      this.status = 'ready'
    })

    this.peer.on('connection', (conn) => {
      console.debug('[P2PHost] attempting to connect with peer:', conn.peer)

      conn.on('open', () => {
        console.debug('[P2PHost] Connection opened with peer:', conn.peer)
        this.clients[conn.peer] = conn
        console.debug(
          '[P2PHost] Informing peer',
          conn.peer,
          ' of current queue',
        )
        this.broadcastQueue(conn.peer)
      })

      conn.on('data', (data) => {
        console.debug(
          '[P2PHost] Received data from peer:',
          conn.peer,
          'Data:',
          data,
        )
        const out = P2PMessage(data)

        if (out instanceof type.errors) {
          console.debug(
            '[P2PHost] Invalid message received from peer:',
            conn.peer,
            'Errors:',
            out,
          )
        } else {
          switch (out.type) {
            case 'PEER_NAME':
              Participants.insert({ id: conn.peer, name: out.payload.name })
              break
            case 'ADD_SONG': {
              this.addSong(out.payload.song, conn.peer)
              break
            }
            default:
              break
          }
        }
      })

      conn.on('close', () => {
        console.debug('[P2PHost] Connection closed with peer:', conn.peer)
        delete this.clients[conn.peer]
      })
    })

    this.peer.on('disconnected', () => {
      console.warn('[P2PHost] Peer disconnected')
      this.status = 'disconnected'
    })

    this.peer.on('error', (err) => {
      console.error('[P2PHost] Error occurred:', err)
      this.errorMessage = err.message
      this.status = 'error'
    })
  }

  private addSong(song: SubmittedSong, peerId: string) {
    const existingSong = Songs.find({
      youtubeId: song.youtubeId,
      status: 'queued',
    }).count()

    if (existingSong > 0) {
      console.debug('[P2PHost] Song is already in the queue')
      this.broadcastFeedback('Song is already in the queue', 'warning', peerId)
    } else {
      Songs.insert({
        ...song,
        addedAt: Date.now(),
        status: 'queued',
        addedById: peerId,
      })

      this.broadcastQueue()
    }
  }

  private broadcastQueue(clientId?: string) {
    console.debug(
      '[P2PHost] Broadcasting current queue. Client:',
      clientId ? clientId : 'all',
    )
    const songs = Songs.find({})
      .fetch()
      .map((song) => ({ ...song, score: song.score }))
    this.sendMessage('CURRENT_QUEUE', { songs }, clientId)
  }

  private broadcastFeedback(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    clientId?: string,
  ) {
    console.debug(
      '[P2PHost] Broadcasting feedback. Message:',
      message,
      'Level:',
      level,
      'Client:',
      clientId,
    )
    this.sendMessage('FEEDBACK', { message, level }, clientId)
  }

  private sendMessage<T extends MessageType>(
    type: T,
    payload: Extract<P2PMessage, { type: T }>['payload'],
    clientId?: string,
  ) {
    if (clientId) {
      console.debug(
        '[P2PHost] Sending message. Type:',
        type,
        'Payload:',
        payload,
        'Client:',
        clientId,
      )
      const conn = this.clients[clientId]
      if (!conn || conn.open === false)
        throw new Error(
          `Cannot send message, no open connection to client ${clientId}`,
        )
      conn.send({ type, payload })
      return
    }
    console.debug(
      '[P2PHost] Broadcasting message. Type:',
      type,
      'Payload:',
      payload,
    )
    for (const clientId in this.clients) {
      const conn = this.clients[clientId]
      if (conn.open) {
        conn.send({ type, payload })
      } else {
        console.warn(
          '[P2PHost] Cannot send message, no open connection to client:',
          clientId,
        )
      }
    }
  }
}
