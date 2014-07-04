
var rrdtool = require('../');

var os = require('os');
var tmp = require('tmp');
var assert = require('assert');

describe('rrd', function () {

  it('should work', function (done) {

    this.timeout(22000);

    tmp.tmpName({ postfix: '.rrd' }, function (err, path) {
      if (err) { throw err; }

      var db = rrdtool.create(path, { step: 1 }, [
        'DS:test:GAUGE:1:0:100',
        'RRA:AVERAGE:0.99:1:10',
        'RRA:AVERAGE:0.99:2:10'
      ]);

      var values = [];

      while (values.length < 20) {
        values.push(Math.random() * 100);
      }

      var id = setInterval(function () {
        if (values.length) {
          db.update('test', values.shift());
        } else {
          clearInterval(id);
          whenPopulated();
        }
      }, 1000);

      function whenPopulated () {
        done();
      }





    });

  });

});
