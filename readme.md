# node-rrdtool

Simple wrapper around [rrdtool](http://oss.oetiker.ch/rrdtool/) for Node.js.

## Usage

```js
import rrdtool from 'rrdtool'

const start = rrdtool.now() - 10
const db = await rrdtool.create('test.rrd', { start, step: 1 }, [
  'DS:test:GAUGE:1:0:100',
  'RRA:AVERAGE:0.5:1:10'
])

await db.update(start + 0, { test: 15 })
await db.update(start + 1, { test: 90 })
await db.update(start + 2, { test: 35 })
await db.update(start + 3, { test: 45 })
await db.update(start + 4, { test: 85 })
await db.update(start + 5, { test: 10 })
await db.update(start + 6, { test: 60 })
await db.update(start + 7, { test: 55 })
await db.update(start + 8, { test: 75 })
await db.update(start + 9, { test: 25 })

const data = await db.fetch('AVERAGE', start, start + 9)

console.log(data)
// [
//   { time: 1747861000, values: { test: 15 } },
//   { time: 1747861001, values: { test: 90 } },
//   { time: 1747861002, values: { test: 35 } },
//   { time: 1747861003, values: { test: 45 } },
//   { time: 1747861004, values: { test: 85 } },
//   { time: 1747861005, values: { test: 10 } },
//   { time: 1747861006, values: { test: 60 } },
//   { time: 1747861007, values: { test: 55 } },
//   { time: 1747861008, values: { test: 75 } },
//   { time: 1747861009, values: { test: 25 } }
// ]
```

## API

### rrdtool

#### `create(file, opts, args)`

Creates a new database.

- `file`: Filename where to save the db
- `opts`
    - `step`: Seconds between each update
    - `start`: Unix timestamp of the first data point
    - `force`: Overwrite file if it exists
- `args`: Array of Data Sources and Round Robin Archives

#### `open(file)`

Loads an existing database.

- `file`: Filename of the db

#### `now()`

Returns the current unix timestamp

### DB

#### `.update([ts, ]values)`

Insert data into the database.

- `ts`: Unix timestamp of the data
- `values`: Object with one entry per data source to insert into

#### `.fetch(cf, start, stop[, res])`

Fetch a span of data from the database.

- `cf`: Consolidation function (`AVERAGE`, `MIN`, `MAX`, `LAST`)
- `start`: Unix timestamp from where to start
- `stop`: Unix timestamp of which to stop at
- `res`: Resolution of the data, specified in seconds
