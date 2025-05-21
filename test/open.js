import assert from 'node:assert/strict'
import path from 'node:path'
import test from 'node:test'

import rrdtool from '../index.js'

const DATA = [35, 75, 50, 85, 65, 0, 20, 95, 25, 0, 75]

test('should open a basic file', async () => {
  const db = await rrdtool.open(path.join(import.meta.dirname, '_simple.rrd'))

  const start = 1405942000
  const src = DATA.map((v, i) => [start + i, v])

  {
    const data = await db.fetch('MAX', start + 10, start + 10, 10)

    assert.equal(data.length, 1)
    assert.equal(data[0].time, start + 10)
    assert.equal(data[0].values.test, 95)
  }

  {
    const data = await db.fetch('AVERAGE', start, start + 10)

    assert.equal(data.length, src.length)

    src.forEach(function (src, i) {
      assert.equal(data[i].time, src[0])
      assert.equal(data[i].values.test, src[1])
    })
  }
})
