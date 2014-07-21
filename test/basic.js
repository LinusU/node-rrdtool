
var rrdtool = require('../');

var fs = require('fs');
var tmp = require('tmp');
var assert = require('assert');

function randomValues (n) {
  var values = [];

  while (values.length < n) {
    values.push(Number((Math.random() * 100).toFixed(4)));
  }

  return values;
}

describe('rrd', function () {

  var path;

  beforeEach(function (done) {
    tmp.tmpName({ postfix: '.rrd' }, function (err, _path) {
      if (err) { throw err; }

      path = _path;
      done();
    });
  });

  afterEach(function (done) {
    fs.unlink(path, function (err) {
      if (err) { throw err; }

      path = undefined;
      done();
    });
  });

  it('should store 10 values', function (done) {

    var start = 1405942000;

    var db = rrdtool.create(path, { start: start, step: 1 }, [
      'DS:test:GAUGE:1:0:100',
      'RRA:AVERAGE:0:1:10'
    ]);

    var src = randomValues(10).map(function (v, i) {
      return [start + i, v];
    });

    src.forEach(function (src) {
      db.update(src[0], { test: src[1] });
    });

    db.fetch('AVERAGE', start, start + 9, function (err, data) {
      if (err) { throw err; }

      src.forEach(function (src, i) {
        assert.equal(data[i].time, src[0]);
        assert.equal(data[i].values.test, src[1]);
      });

      done(null);
    });

  });

  it('should store an average over 20 seconds', function (done) {

    var start = 1405942000;

    var db = rrdtool.create(path, { start: start, step: 1 }, [
      'DS:test:GAUGE:1:0:100',
      'RRA:AVERAGE:0:1:20',
      'RRA:AVERAGE:0:20:1'
    ]);

    var src = randomValues(21).map(function (v, i) {
      return [start + i, v];
    });

    src.forEach(function (src) {
      db.update(src[0], { test: src[1] });
    });

    db.fetch('AVERAGE', start + 19, start + 19, 20, function (err, data) {
      if (err) { throw err; }

      assert.equal(data.length, 1);

      var avg = src.slice(1).reduce(function (p, c) {
        return p + (c[1] / 20);
      }, 0);

      var actual = Number(data[0].values.test.toFixed(4));
      var expected = Number(avg.toFixed(4));

      assert.equal(actual, expected);

      done(null);
    });

  });

  it('should handle two series', function (done) {

    var start = 1405942000;

    var db = rrdtool.create(path, { start: start, step: 1 }, [
      'DS:test1:GAUGE:1:0:100',
      'DS:test2:GAUGE:1:0:100',
      'RRA:AVERAGE:0:1:10'
    ]);

    var src1 = randomValues(10);
    var src2 = randomValues(10);

    for (var i=0; i<10; i++) {
      db.update(start + i, { test1: src1[i], test2: src2[i] });
    }

    db.fetch('AVERAGE', start, start + 9, function (err, data) {
      if (err) { throw err; }

      assert.equal(data.length, 10);

      for (var i=0; i<10; i++) {
        assert.equal(data[i].time, start + i);
        assert.equal(data[i].values.test1, src1[i]);
        assert.equal(data[i].values.test2, src2[i]);
      }

      done(null);
    });

  });

  it('should handle default values', function (done) {

    var db = rrdtool.create(path, { step: 1 }, [
      'DS:test:GAUGE:1:0:100',
      'RRA:AVERAGE:0.99:1:10'
    ]);

    db.update(rrdtool.now() - 1, { test: 14 });
    db.update({ test: 14 });

    db.fetch('AVERAGE', rrdtool.now(), rrdtool.now(), function (err, data) {
      if (err) { throw err; }

      assert.equal(data.length, 1);
      assert.equal(data[0].values.test, 14);

      done(null);
    });

  });

});
