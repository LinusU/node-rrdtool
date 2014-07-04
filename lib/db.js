
var proc = require('./proc');
var Promise = require('./promise');

var async = require('async');

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

  var a = [];
  var db = new DB;

  if (opts.start) {
    a.push('--start');
    a.push('' + opts.start);
  }

  if (opts.step) {
    a.push('--step');
    a.push('' + opts.step);
  }

  if (!opts.force) {
    a.push('--no-overwrite');
  }

  proc.create(file, a.concat(args), function (err) {
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
    var name = args[1];
    var value = args[2];

    if (!this.info.ds[name]) {
      return cb(new Error('Unknown data source: ' + name));
    }

    proc.update(this.file, name, value, cb);
    break;
  }

};

DB.prototype.update = function (name, value, cb) {
  this.queue.push(['update', name, value], cb);
};

module.exports = exports = DB;
