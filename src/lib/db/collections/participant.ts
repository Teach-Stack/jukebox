import { type } from 'arktype'
import { BaseEntity, Collection } from '../helper.svelte'

export const ParticipantType = type({
  id: 'string',
  name: 'string',
})

export type ParticipantType = typeof ParticipantType.infer

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
