import { Collection } from '../helper.svelte'

export class Vote {
  id!: string

  songId!: string
  participantId!: string

  value!: 'up' | 'down'

  timestamp!: number

  constructor(data: ClassProperties<Vote>) {
    Object.assign(this, data)
  }
}

class VoteCollection extends Collection<Vote> {
  constructor() {
    super({
      name: 'votes',
      transform: (data) => new Vote(data),
    })
  }
}

export const Votes = new VoteCollection()
