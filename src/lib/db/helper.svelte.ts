import {
  type BaseItem,
  type CollectionOptions,
  Collection as CoreCollection,
} from '@signaldb/core'
import createIndexedDBAdapter from '@signaldb/indexeddb'
import svelteReactivityAdapter from '@signaldb/svelte'

export function BaseEntity<T extends Record<string, any>>() {
  return class {
    constructor(data: T) {
      Object.assign(this, data)
    }
  } as new (
    data: T,
  ) => T
}

export class Collection<
  T extends BaseItem<I> = BaseItem,
  U = T,
  I extends IDBValidKey = IDBValidKey,
> extends CoreCollection<T, I, U> {
  constructor(options: CollectionOptions<T, I, U>) {
    if (options.name === undefined)
      throw new Error('Collection name is required')

    super({
      ...options,
      persistence: createIndexedDBAdapter<T, I>(options.name, {
        prefix: 'step-out-',
      }),
      reactivity: svelteReactivityAdapter,
    })
  }
}
