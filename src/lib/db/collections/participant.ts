import { BaseEntity, Collection } from '../helper.svelte'

interface ParticipantType {
  id: string
  name: string
}

export class Participant extends BaseEntity<ParticipantType>() {}

class ParticipantCollection extends Collection<ParticipantType, Participant> {
  constructor() {
    super({
      name: 'participants',
      transform: (data) => new Participant(data),
    })
  }
}

export const Participants = new ParticipantCollection()
