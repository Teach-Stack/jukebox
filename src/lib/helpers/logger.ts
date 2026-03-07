import { createConsola } from 'consola'

import { dev } from '$app/environment'

const logLevel = dev
  ? 5
  : parseInt(sessionStorage.getItem('jukebox:log-level') ?? '0', 10)

export function createLogger(tag?: string) {
  return createConsola({
    defaults: {
      tag,
    },
    level: logLevel,
  })
}
