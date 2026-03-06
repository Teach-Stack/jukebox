import { type } from 'arktype'
import { type DataConnection, Peer } from 'peerjs'

import type { Song } from '$lib/db'

import { type MessageType, P2PMessage } from './messages'

type ConnectionStatus = 'disconnected' | 'connected' | 'ready' | 'error'

export class P2PClient {
  private peer = new Peer({ debug: 2 })

  private connection: DataConnection | null = null

  peerId = $state<string | null>(null)

  status = $state<ConnectionStatus>('disconnected')
  errorMessage = $state<string | null>(null)

  name = $state<string>('')
  hostId = $state<string>('')

  songs = $state<Song[]>([])

  constructor() {
    this.peer.on('open', (id) => {
      console.debug('[P2PClient] Peer opened with ID:', id)
      this.peerId = id
      this.status = 'ready'
    })
  }

  connect() {
    console.debug(
      '[P2PClient] Attempting to connect to host with ID:',
      this.hostId,
    )
    this.connection = this.peer.connect(this.hostId)

    this.connection.on('open', () => {
      console.debug('[P2PClient] Connection opened with host:', this.hostId)
      this.status = 'connected'

      this.sendMessage('PEER_NAME', { name: this.name })
    })

    this.connection.on('data', (data) => {
      console.debug('[P2PClient] Received data from host:', 'Data:', data)
      const out = P2PMessage(data)

      if (out instanceof type.errors) {
        console.debug(
          '[P2PClient] Invalid message received from host:',
          'Errors:',
          out,
        )
      } else {
        switch (out.type) {
          case 'CURRENT_QUEUE':
            console.debug(
              '[P2PClient] Received current queue from host:',
              'Songs:',
              out.payload.songs,
            )
            break
          default:
            console.warn('[P2PClient] Unhandled message type:', out.type)
        }
      }
    })

    this.connection.on('close', () => {
      console.debug('[P2PClient] Connection closed with host:', this.hostId)
      this.status = 'disconnected'
    })

    this.connection.on('error', (err) => {
      console.error('[P2PClient] Error occurred:', err)
      this.status = 'error'
      this.errorMessage = err.message
    })
  }

  sendMessage<T extends MessageType>(
    type: T,
    payload: Extract<P2PMessage, { type: T }>['payload'],
  ) {
    if (!this.connection || this.connection.open === false) {
      console.warn('[P2PClient] Cannot send message, no open connection')
      return
    }

    console.debug(
      '[P2PClient] Sending message type:',
      type,
      'Payload:',
      payload,
    )
    this.connection.send({ type, payload })
  }
}
