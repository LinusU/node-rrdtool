
var DB = require('./lib/db');
var util = require('./lib/util');

exports.open = DB.open;
exports.create = DB.create;

exports.now = util.now;
