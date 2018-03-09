
var proc = require('./proc');
var util = require('./util');

var async = require('async');
var assert = require('assert');
var events = require('events');
var EventEmitter = events.EventEmitter;

function DB () {
  this.info = null;
  this.file = null;
  this.queue = async.queue(this._worker.bind(this), 1);
  this.queue.pause();
  EventEmitter.call(this);
}

DB.prototype = Object.create(EventEmitter.prototype);

DB.open = function (file) {
  var db = new DB;
  db._load(file);

  return db;
};

DB.create = function (file, opts, args) {

  var db = new DB;

  proc.create(file, opts, args, function (err) {
    if (err) { return db.emit('error', err); }

    db._load(file);
  });

  return db;
};

DB.prototype._load = function (file) {
  var self = this;

  proc.info(file, function (err, info) {
    if (err) { return self.emit('error', err); }

    self.file = file;
    self.info = info;
    self.queue.resume();
  });

};

DB.prototype._worker = function (args, cb) {

  switch (args[0]) {
  case 'update':
    var ts = args[1];
    var values = args[2];
    var ds = this.info.ds;

    var unknown = Object.keys(values).map(function (name) {
      var matching = ds.filter(function (ds) { return ds.name === name; });

      return (matching.length === 1 ? null : name);
    }).filter(Boolean);

    if (unknown.length > 0) {
      if (unknown.length === 1) {
        return cb(new Error('Unknown data source: ' + unknown[0]));
      } else {
        return cb(new Error('Unknown data sources: ' + unknown.join(', ')));
      }
    }

    proc.update(this.file, ts, values, cb);
    break;
  case 'fetch':
    var cf = args[1];
    var start = args[2];
    var stop = args[3];
    var res = args[4];
    var dae = args[5];

    proc.fetch(this.file, cf, start, stop, res, dae, cb);
    break;
  case 'dump':

    proc.dump(this.file, function (err, text) {
      if (err) { return cb(err); }

      console.log(text);
      cb(null);
    });
    break;
  default:
    assert(0, 'Unknown task: ' + args[0]);
  }

};

DB.prototype._cb = function (cb) {
  var self = this;

  return cb || function (err) {
    if (err) { self.emit('error', err); }
  };
};

DB.prototype.update = function (ts, values, cb) {
  // `ts` is optional and defaults to 'N'

  if (arguments.length === 2) {
    if (typeof values === 'function') {
      cb = values;
      values = ts;
      ts = util.now();
    }
  }

  if (arguments.length === 1) {
    values = ts;
    ts = util.now();
  }

  this.queue.push([['update', ts, values]], this._cb(cb));
};

DB.prototype.fetch = function (cf, start, stop, res, dae, cb) {
  // `res` is optional and defaults to highest possible
  // `dae` is optional

  switch (typeof res) {
    case 'function' :
      cb = res;
      res = dae = null;
      break;
    case 'number' :
      if (typeof dae === 'function') {
        cb = dae;
        dae = null;
      }
      break;
    case 'string' :
      if (typeof dae === 'function') {
        cb = dae;
        dae = res;
        res = null;
      }
      break;
  }

  this.queue.push([['fetch', cf, start, stop, res, dae]], this._cb(cb));
};

DB.prototype._dump = function () {
  this.queue.push([['dump']], this._cb());
};

module.exports = exports = DB;
