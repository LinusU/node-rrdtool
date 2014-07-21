
# node-rrdtool

## Usage

```js
var rrdtool = require('rrdtool');
var db = rrdtool.create('test.rrd', { step: 5 }, [
  'DS:load:GAUGE:1:0:100',
  'RRA:AVERAGE:0.5:1:12',
  'RRA:AVERAGE:0.5:10:12'
]);

setInterval(function () {
  var l = os.loadavg();

  db.update('load', l[0]);
}, 5000)
```
