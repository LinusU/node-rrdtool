
# node-rrdtool

## Usage

```js
var rrdtool = require('rrdtool');

var start = rrdtool.now() - 10;
var db = rrdtool.create('test.rrd', { start: start, step: 1 }, [
  'DS:test:GAUGE:1:0:100',
  'RRA:AVERAGE:0.5:1:10'
]);

db.update(start + 0, 15);
db.update(start + 1, 90);
db.update(start + 2, 35);
db.update(start + 3, 45);
db.update(start + 4, 85);
db.update(start + 5, 10);
db.update(start + 6, 60);
db.update(start + 7, 55);
db.update(start + 8, 75);
db.update(start + 9, 25);

db.fetch('AVERAGE', start, start + 9, function (err, data) {
  if (err) { throw err; }

  console.log(data);
});
```

## API

### rrdtool

#### `.create(file, opts, args)`

Creates a new database.

 - `file`: Filename where to save the db
 - `opts`
   - `step`: Seconds between each update
   - `start`: Unix timestamp of the first data point
   - `force`: Overwrite file if it exists
 - `args`: Array of Data Sources and Round Robin Archives

#### `.open(file)`

Loads an existing database.

 - `file`: Filename of the db

#### `.now()`

Returns the current unix timestamp

### DB

#### `.update([ts, ]values[, cb])`

Insert data into the database.

 - `ts`: Unix timestamp of the data
 - `values`: Object with one entry per data source to insert into
 - `cb`: Callback to call when the data is inserted `(err)`

#### `.fetch(cf, start, stop[, res, daemon], cb)`

Fetch a span of data from the database.

 - `cf`: Consolidation function (`AVERAGE`, `MIN`, `MAX`, `LAST`)
 - `start`: Unix timestamp from where to start
 - `stop`: Unix timestamp of which to stop at
 - `res`: Resolution of the data, specified in seconds
 - `daemon`: Daemon address
 - `cb`: Callback to call when the data is ready `(err, data)`
