import assert from 'node:assert/strict'
import fs from 'node:fs/promises'
import { dirname, join } from 'node:path'
import test, { afterEach, beforeEach, describe } from 'node:test'
import temp from 'fs-temp/promises'

import rrdtool from '../index.js'

function randomValues (n) {
  const values = []

  while (values.length < n) {
    values.push(Number((Math.random() * 100).toFixed(4)))
  }

  return values
}

describe('rrd', () => {
  let path

  beforeEach(async () => {
    path = join(await temp.mkdir(), 'file.rrd')
  })

  afterEach(async () => {
    await fs.unlink(path)
    await fs.rmdir(dirname(path))
  })

  test('should store 10 values', async () => {
    const start = 1405942000

    const db = await rrdtool.create(path, { start, step: 1 }, [
      'DS:test:GAUGE:1:0:100',
      'RRA:AVERAGE:0:1:10'
    ])

    const src = randomValues(10).map((v, i) => [start + i, v])

    for (const [key, test] of src) {
      await db.update(key, { test })
    }

    const data = await db.fetch('AVERAGE', start, start + 9)

    src.forEach((src, i) => {
      assert.equal(data[i].time, src[0])
      assert.equal(data[i].values.test, src[1])
    })
  })

  test('should store an average over 20 seconds', async () => {
    const start = 1405942000

    const db = await rrdtool.create(path, { start, step: 1 }, [
      'DS:test:GAUGE:1:0:100',
      'RRA:AVERAGE:0:1:20',
      'RRA:AVERAGE:0:20:1'
    ])

    const src = randomValues(21).map((v, i) => [start + i, v])

    for (const [key, test] of src) {
      await db.update(key, { test })
    }

    const data = await db.fetch('AVERAGE', start + 19, start + 19, 20)

    assert.equal(data.length, 1)

    const avg = src.slice(1).reduce((p, c) => p + (c[1] / 20), 0)

    const actual = Number(data[0].values.test.toFixed(4))
    const expected = Number(avg.toFixed(4))

    assert.equal(actual, expected)
  })

  test('should handle two series', async () => {
    const start = 1405942000

    const db = await rrdtool.create(path, { start, step: 1 }, [
      'DS:test1:GAUGE:1:0:100',
      'DS:test2:GAUGE:1:0:100',
      'RRA:AVERAGE:0:1:10'
    ])

    const src1 = randomValues(10)
    const src2 = randomValues(10)

    for (let i = 0; i < 10; i++) {
      await db.update(start + i, { test1: src1[i], test2: src2[i] })
    }

    const data = await db.fetch('AVERAGE', start, start + 9)

    assert.equal(data.length, 10)

    for (let i = 0; i < 10; i++) {
      assert.equal(data[i].time, start + i)
      assert.equal(data[i].values.test1, src1[i])
      assert.equal(data[i].values.test2, src2[i])
    }
  })

  test('should handle default values', async () => {
    const db = await rrdtool.create(path, { step: 1 }, [
      'DS:test:GAUGE:1:0:100',
      'RRA:AVERAGE:0.99:1:10'
    ])

    const a = db.update(rrdtool.now() - 1, { test: 14 })
    const b = db.update({ test: 14 })
    const c = db.fetch('AVERAGE', rrdtool.now(), rrdtool.now())

    const data = (await Promise.all([a, b, c]))[2]

    assert.equal(data.length, 1)
    assert.equal(data[0].values.test, 14)
  })

  test('should fetch a specific value', async () => {
    const start = 1405942000

    const db = await rrdtool.create(path, { start, step: 1 }, [
      'DS:test:GAUGE:1:0:100',
      'RRA:AVERAGE:0:1:10'
    ])

    const src = randomValues(10).map((v, i) => [start + i, v])
    const target = src[5]

    for (const [key, test] of src) {
      db.update(key, { test })
    }

    const data = await db.fetch('AVERAGE', target[0], target[0])

    assert.equal(data.length, 1)
    assert.equal(data[0].time, target[0])
    assert.equal(data[0].values.test, target[1])
  })

  test('should store the max value', async function () {
    const start = 1405942000

    const db = await rrdtool.create(path, { start, step: 1 }, [
      'DS:test:GAUGE:1:0:100',
      'RRA:AVERAGE:0:1:10',
      'RRA:MAX:0:10:1'
    ])

    const src = [0, ...randomValues(10)].map((v, i) => [start + i, v])
    const max = src.reduce((p, c) => (p > c[1] ? p : c[1]), 0)

    for (const [key, test] of src) {
      await db.update(key, { test })
    }

    const data = await db.fetch('MAX', start + 10, start + 10, 10)

    assert.equal(data.length, 1)
    assert.equal(data[0].time, start + 10)
    assert.equal(data[0].values.test, max)
  })
})
