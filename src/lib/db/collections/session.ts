import { type } from 'arktype'

import { BaseEntity, Collection } from '../helper.svelte'

export const SessionType = type({
  id: 'string',
})

export type SessionType = typeof SessionType.infer

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
