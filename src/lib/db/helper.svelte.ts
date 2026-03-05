import {
  type BaseItem,
  type CollectionOptions,
  Collection as CoreCollection,
} from '@signaldb/core'
import createIndexedDBAdapter from '@signaldb/indexeddb'
import svelteReactivityAdapter from '@signaldb/svelte'

export class Collection<
  T extends BaseItem<I> = BaseItem,
  I = string,
> extends CoreCollection<T> {
  constructor(options: CollectionOptions<T, I>) {
    if (options.name === undefined)
      throw new Error('Collection name is required')

    super({
      ...options,
      persistence: createIndexedDBAdapter(options.name, {
        prefix: 'jukebox-',
      }),
      reactivity: svelteReactivityAdapter,
    })
  }
}
