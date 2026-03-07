import { type } from 'arktype'
import { type DataConnection, Peer } from 'peerjs'

import { createLogger } from '$lib'
import type { SongType } from '$lib/db'

import { type MessageType, P2PMessage } from './messages'

type ConnectionStatus = 'disconnected' | 'connected' | 'ready' | 'error'

const logger = createLogger('P2PClient')

export class P2PClient {
  private peer: Peer

  private connection: DataConnection | null = null

  peerId = $state<string | null>(sessionStorage.getItem('peerId'))

  status = $state<ConnectionStatus>('disconnected')
  errorMessage = $state<string | null>(null)

  name = $state<string>('')
  hostId = $state<string>('')

  songs = $state<SongType[]>([])

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
      sessionStorage.setItem('peerId', id)
      this.status = 'ready'
    })

    this.peer.on('error', (err) => {
      logger.fail('Peer error:', err)
      this.status = 'error'
      this.errorMessage = err.message
    })
  }

  connect() {
    logger.debug('Attempting to connect to host with ID:', this.hostId)
    this.connection = this.peer.connect(this.hostId)

    this.connection.on('open', () => {
      logger.success('Connection opened with host:', this.hostId)
      this.status = 'connected'

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
          default:
            logger.warn('Unhandled message type:', out.type)
        }
      }
    })

    this.connection.on('close', () => {
      logger.debug('Connection closed with host:', this.hostId)
      this.status = 'disconnected'
    })

    this.connection.on('error', (err) => {
      logger.error('Connection error:', err)
      this.status = 'error'
      this.errorMessage = err.message
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
