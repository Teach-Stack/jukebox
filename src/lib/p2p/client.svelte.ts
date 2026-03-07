import { type } from 'arktype'
import { BaseConnectionErrorType, type DataConnection, DataConnectionErrorType, Peer, PeerErrorType } from 'peerjs'

import { createLogger } from '$lib'

import { type MessageType, P2PMessage, type SongInQueue } from './messages'

type ConnectionStatus = 'disconnected' | 'connected' | 'connecting' | 'error'
type PeerStatus = 'pending' | 'ready' | 'error' | 'disconnected'

const logger = createLogger('P2PClient')

export class P2PClient {
  private peer: Peer
  peerId = $state<string | null>(sessionStorage.getItem('jukebox:peer-id'))
  peerStatus = $state<PeerStatus>('pending')
  peerError = $state<`${PeerErrorType}` | null>(null)

  private connection: DataConnection | null = null
  connectionStatus = $state<ConnectionStatus>('disconnected')
  connectionError = $state<`${DataConnectionErrorType}` | `${BaseConnectionErrorType}` | null>(null)

  kicked = $state(false)

  name = $state<string>('')
  hostId = $state<string>('')

  songs = $state<SongInQueue[]>([])

  constructor() {
    logger.start('Initializing P2PClient')
    if (this.peerId) {
      logger.debug(
        'Restoring previous peer ID from session storage:',
        this.peerId,
      )
      this.peer = new Peer(this.peerId, { debug: 2 })
    } else {
      logger.debug(
        'No previous peer ID found in session storage, creating new peer',
      )
      this.peer = new Peer({ debug: 2 })
    }

    this.peer.on('open', (id) => {
      logger.ready('Peer opened with ID:', id)
      this.peerId = id
      sessionStorage.setItem('jukebox:peer-id', id)
      this.peerStatus = 'ready'
    })

    this.peer.on('error', (err) => {
      logger.fail('Peer error:', err)
      this.peerStatus = 'error'
      this.peerError = err.type
    })
  }

  connect() {
    logger.debug('Attempting to connect to host with ID:', this.hostId)
    this.connectionStatus = 'connecting'
    this.connection = this.peer.connect(this.hostId)

    this.connection.on('open', () => {
      logger.success('Connection opened with host:', this.hostId)
      this.connectionStatus = 'connected'

      this.sendMessage('PEER_NAME', { name: this.name })
    })

    this.connection.on('data', (data) => {
      logger.debug('Received data from host:', 'Data:', data)
      const out = P2PMessage(data)

      if (out instanceof type.errors) {
        logger.warn('Invalid message received from host:', 'Errors:', out)
      } else {
        switch (out.type) {
          case 'CURRENT_QUEUE':
            logger.debug(
              'Received current queue from host:',
              'Songs:',
              out.payload.songs,
            )
            this.songs = out.payload.songs
            break
          case 'FEEDBACK':
            logger.debug(
              'Received feedback from host:',
              'Message:',
              out.payload.message,
              'Level:',
              out.payload.level,
            )
            alert(`[${out.payload.level.toUpperCase()}] ${out.payload.message}`)
            break
          case 'KICK':
            logger.warn('Kicked by host')
            this.kicked = true
            sessionStorage.removeItem('peerId')
            this.connection?.close()
            this.connectionStatus = 'disconnected'
            break
          default:
            logger.warn('Unhandled message type:', out.type)
        }
      }
    })

    this.connection.on('close', () => {
      logger.debug('Connection closed with host:', this.hostId, 'Attempting to reconnect...')
      this.connectionStatus = 'disconnected'
    })

    this.connection.on('error', (err) => {
      logger.error('Connection error:', err)
      this.connectionStatus = 'error'
      this.connectionError = err.type
    })
  }

  sendMessage<T extends MessageType>(
    type: T,
    payload: Extract<P2PMessage, { type: T }>['payload'],
  ) {
    if (!this.connection || this.connection.open === false) {
      logger.warn('Cannot send message, no open connection')
      return
    }

    logger.debug('Sending message type:', type, 'Payload:', payload)
    this.connection.send({ type, payload })
  }

  submitSong(song: {
    youtubeId: string
    title: string
    artist: string
    thumbnailUrl: string
    duration: number
  }) {
    this.sendMessage('ADD_SONG', { song })
  }
}
