import { Collection } from '../helper.svelte'

export class Session {
  id!: string

  joinCode!: string

  constructor(data: ClassProperties<Session>) {
    Object.assign(this, data)
  }
}

class SessionCollection extends Collection<Session> {
  constructor() {
    super({
      name: 'session',
      transform: (data) => new Session(data),
    })
  }
}

export const Sessions = new SessionCollection()
