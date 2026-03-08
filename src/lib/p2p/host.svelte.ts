import { type } from 'arktype'
import { type DataConnection, Peer } from 'peerjs'

import { createLogger } from '$lib'
import { Participants, Songs, Votes } from '$lib/db'

import { type MessageType, P2PMessage, type SubmittedSong } from './messages'

type ConnectionStatus = 'disconnected' | 'ready' | 'error'

const logger = createLogger('P2PHost')

export class P2PHost {
  private peer: Peer
  private clients = $state<Record<string, DataConnection>>({})
  private kickedIds = $state<Set<string>>(new Set())

  status = $state<ConnectionStatus>('disconnected')

  errorMessage = $state<string | null>(null)

  clientIds = $derived(Object.keys(this.clients))

  constructor(id: string) {
    logger.start('Initializing P2PHost with ID:', id)

    this.peer = new Peer(id, { debug: 2 })

    this.peer.on('open', () => {
      logger.ready('Peer opened with ID:', this.peer.id)
      this.status = 'ready'
    })

    this.peer.on('connection', (conn) => {
      logger.debug('attempting to connect with peer:', conn.peer)

      if (this.kickedIds.has(conn.peer)) {
        logger.warn('Rejected connection from kicked peer:', conn.peer)
        conn.on('open', () => {
          this.broadcastFeedback(
            'You have been removed from this room',
            'error',
            conn.peer,
          )
          conn.close()
        })
        return
      }

      conn.on('open', () => {
        logger.success('Connection opened with peer:', conn.peer)
        this.clients[conn.peer] = conn
        logger.debug('Informing peer', conn.peer, ' of current queue')
        this.broadcastQueue(conn.peer)
      })

      conn.on('data', (data) => {
        logger.debug('Received data from peer:', conn.peer, 'Data:', data)
        const out = P2PMessage(data)

        if (out instanceof type.errors) {
          logger.debug(
            'Invalid message received from peer:',
            conn.peer,
            'Errors:',
            out,
          )
        } else {
          switch (out.type) {
            case 'PEER_NAME':
              this.peerName(conn.peer, out.payload.name)
              break
            case 'ADD_SONG': {
              this.addSong(out.payload.song, conn.peer)
              break
            }
            case 'CAST_VOTE': {
              this.castVote(out.payload.songId, out.payload.value, conn.peer)
              break
            }
            default:
              break
          }
        }
      })

      conn.on('close', () => {
        logger.debug('Connection closed with peer:', conn.peer)
        delete this.clients[conn.peer]
      })
    })

    this.peer.on('disconnected', () => {
      logger.warn('Peer disconnected')
      this.status = 'disconnected'
    })

    this.peer.on('error', (err) => {
      logger.error('Error occurred:', err)
      this.errorMessage = err.message
      this.status = 'error'
    })
  }

  removeSong(songId: string) {
    logger.debug('Attempting to remove song:', songId)

    const song = Songs.findOne({ id: songId, status: 'queued' })
    if (!song) {
      logger.warn('Song not found or not queued, cannot remove:', songId)
      return
    }

    Votes.removeMany({ songId })
    Songs.removeOne({ id: songId })
    logger.success('Song removed from queue:', songId)

    this.broadcastQueue()
  }

  kickParticipant(peerId: string) {
    logger.debug('Kicking participant:', peerId)

    const conn = this.clients[peerId]
    if (conn) {
      this.sendMessage('KICK', {}, peerId)
      conn.close()
      delete this.clients[peerId]
    }

    Songs.find({ addedById: peerId, status: 'queued' })
      .fetch()
      .forEach((song) => {
        Votes.removeMany({ songId: song.id })
        Songs.removeOne({ id: song.id })
      })

    Participants.removeOne({ id: peerId })
    this.kickedIds.add(peerId)

    logger.success('Participant kicked:', peerId)
    this.broadcastQueue()
  }
  private peerName(id: string, name: string) {
    logger.debug('Received peer name from peer:', id, 'Name:', name)
    const existing = Participants.find({ id }).count()

    if (existing === 0) {
      Participants.insert({ id, name })
      logger.success('Added new participant:', name, 'with ID:', id)
    } else {
      Participants.updateOne({ id }, { $set: { name } })
      logger.debug('Updated participant name for ID:', id, 'to:', name)
    }
  }

  private addSong(song: SubmittedSong, peerId: string) {
    logger.debug('Attempting to add song from peer:', peerId, 'Song:', song)

    logger.debug('Checking if song is already in the queue')
    const existingSong = Songs.find({
      youtubeId: song.youtubeId,
      status: 'queued',
    }).count()

    if (existingSong > 0) {
      logger.fail(
        'Song is already in the queue. Cannot add duplicate:',
        song.youtubeId,
      )
      this.broadcastFeedback('Song is already in the queue', 'warning', peerId)
    } else {
      Songs.insert({
        ...song,
        addedAt: Date.now(),
        status: 'queued',
        addedById: peerId,
      })
      logger.success('Song added to queue:', song.title, 'by peer:', peerId)

      this.broadcastQueue()
    }
  }

  private castVote(songId: string, value: 'up' | 'down', peerId: string) {
    logger.debug(
      'Attempting to cast vote from peer:',
      peerId,
      'Song:',
      songId,
      'Value:',
      value,
    )

    // Check if song exists and is queued
    const song = Songs.findOne({ id: songId, status: 'queued' })
    if (!song) {
      logger.warn('Cannot vote: Song not found or not queued:', songId)
      this.broadcastFeedback('Cannot vote on this song', 'error', peerId)
      return
    }

    // Check if user already voted on this song
    const existingVote = Votes.findOne({ songId, participantId: peerId })
    if (existingVote) {
      logger.warn(
        'Cannot vote: User already voted on this song:',
        peerId,
        songId,
      )
      this.broadcastFeedback(
        'You have already voted on this song',
        'error',
        peerId,
      )
      return
    }

    // Check if user is voting on their own song
    if (song.addedById === peerId) {
      logger.warn(
        'Cannot vote: User trying to vote on their own song:',
        peerId,
        songId,
      )
      this.broadcastFeedback(
        'You cannot vote on your own song',
        'error',
        peerId,
      )
      return
    }

    // Insert vote
    Votes.insert({
      id: crypto.randomUUID(),
      songId,
      participantId: peerId,
      value,
      timestamp: Date.now(),
    })
    logger.success('Vote cast:', value, 'on song:', songId, 'by peer:', peerId)

    // Broadcast updated queue
    this.broadcastQueue()
  }

  private broadcastQueue(clientId?: string) {
    logger.debug(
      'Broadcasting current queue. Client:',
      clientId ? clientId : 'all',
    )
    const songs = Songs.find({}).map((song) => ({
      ...song,
      score: song.score,
      addedBy: song.addedBy,
    }))

    this.sendMessage('CURRENT_QUEUE', { songs }, clientId)
  }

  private broadcastFeedback(
    message: string,
    level: 'info' | 'warning' | 'error' = 'info',
    clientId?: string,
  ) {
    logger.debug(
      'Broadcasting feedback. Message:',
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
      logger.debug(
        'Sending message. Type:',
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
    logger.debug('Broadcasting message. Type:', type, 'Payload:', payload)
    for (const clientId in this.clients) {
      const conn = this.clients[clientId]
      if (conn.open) {
        conn.send({ type, payload })
      } else {
        logger.warn(
          'Cannot send message, no open connection to client:',
          clientId,
        )
      }
    }
  }
}
