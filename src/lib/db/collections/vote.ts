import { BaseEntity, Collection } from '../helper.svelte'

interface VoteType {
  id: string

  songId: string
  participantId: string

  value: 'up' | 'down'

  timestamp: number
}

export class Vote extends BaseEntity<VoteType>() {}

class VoteCollection extends Collection<VoteType, Vote> {
  constructor() {
    super({
      name: 'votes',
      transform: (data) => new Vote(data),
    })
  }
}

export const Votes = new VoteCollection()
