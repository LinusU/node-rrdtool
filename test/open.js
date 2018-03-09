
var rrdtool = require('../');

var path = require('path');
var assert = require('assert');

var DATA = [35,75,50,85,65,0,20,95,25,0,75];

describe('rrd', function () {

  it('should open a basic file', function (done) {

    var i = 2;
    function cb () {
      if (--i === 0) { done(); }
    };

    var start = 1405942000;

    var f = path.join(__dirname, '_simple.rrd');
    var db = rrdtool.open(f);

    var src = DATA.map(function (v, i) {
      return [start + i, v];
    });

    db.fetch('MAX', start + 10, start + 10, 10, function (err, data) {

      assert.equal(data.length, 1);
      assert.equal(data[0].time, start + 10);
      assert.equal(data[0].values.test, 95);

      cb();
    });

    db.fetch('AVERAGE', start, start + 10, function (err, data) {

      assert.equal(data.length, src.length);

      src.forEach(function (src, i) {
        assert.equal(data[i].time, src[0]);
        assert.equal(data[i].values.test, src[1]);
      });

      cb();
    });

  });

});
