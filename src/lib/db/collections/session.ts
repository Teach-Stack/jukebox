import { BaseEntity, Collection } from '../helper.svelte'

interface SessionType {
  id: string
  joinCode: string
}

export class Session extends BaseEntity<SessionType>() {}

class SessionCollection extends Collection<SessionType, Session> {
  constructor() {
    super({
      name: 'session',
      transform: (data) => new Session(data),
    })
  }
}

export const Sessions = new SessionCollection()
