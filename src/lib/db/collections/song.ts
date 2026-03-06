import { Collection } from '../helper.svelte'
import { Participants } from './participant'
import { Votes } from './vote'

export class Song {
  id!: string

  youtubeId!: string

  title!: string
  artist!: string
  thumbnailUrl!: string
  duration!: number

  addedById!: string
  addedAt!: number

  status!: 'queued' | 'playing' | 'played'

  constructor(data: ClassProperties<Song>) {
    Object.assign(this, data)
  }

  get votes() {
    return Votes.find({ songId: this.id }).fetch()
  }

  get score() {
    const votes = this.votes
    return votes.reduce((score, vote) => {
      if (vote.value === 'up') return score + 1
      if (vote.value === 'down') return score - 1
      return score
    }, 0)
  }

  get addedBy() {
    return Participants.findOne({ id: this.addedById })
  }
}

class SongCollection extends Collection<Song> {
  constructor() {
    super({
      name: 'songs',
      transform: (data) => new Song(data),
    })
  }
}

export const Songs = new SongCollection()
