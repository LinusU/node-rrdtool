import Queue from 'p-queue'

import { now } from './util.js'
import * as proc from './proc.js'

export default class DB {
  #file
  #info
  #queue = new Queue({ concurrency: 1 })

  constructor (file, info) {
    this.#file = file
    this.#info = info
  }

  static async open (file) {
    const info = await proc.info(file)
    return new DB(file, info)
  }

  static async create (file, opts, args) {
    await proc.create(file, opts, args)
    const info = await proc.info(file)
    return new DB(file, info)
  }

  /** `ts` is optional and defaults to 'N' */
  update (ts, values) {
    if (arguments.length === 1) {
      values = ts
      ts = now()
    }

    return this.#queue.add(async () => {
      const ds = this.#info.ds

      const unknown = Object.keys(values).map((name) => {
        const matching = ds.filter((ds) => ds.name === name)

        return (matching.length === 1 ? null : name)
      }).filter(Boolean)

      if (unknown.length > 0) {
        if (unknown.length === 1) {
          throw new Error('Unknown data source: ' + unknown[0])
        } else {
          throw new Error('Unknown data sources: ' + unknown.join(', '))
        }
      }

      await proc.update(this.#file, ts, values)
    })
  }

  /** `res` is optional and defaults to highest possible */
  fetch (cf, start, stop, res) {
    return this.#queue.add(async () => {
      return await proc.fetch(this.#file, cf, start, stop, res)
    })
  }

  _dump () {
    return this.#queue.add(async () => {
      return await proc.dump(this.#file)
    })
  }
}
