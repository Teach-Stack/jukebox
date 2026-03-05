import { Collection } from '../helper.svelte'

export class Participant {
  id!: string

  name!: string

  constructor(data: ClassProperties<Participant>) {
    Object.assign(this, data)
  }
}

class ParticipantCollection extends Collection<Participant> {
  constructor() {
    super({
      name: 'participants',
      transform: (data) => new Participant(data),
    })
  }
}

export const Participants = new ParticipantCollection()
