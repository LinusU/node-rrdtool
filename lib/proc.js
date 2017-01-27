
var debug = require('debug')('rrdtool:proc');
var child_process = require('child_process');

function exec (args, cb) {
  debug(['rrdtool'].concat(args).join(' '));

  var stdout = [];
  var stderr = [];
  var p = child_process.spawn('rrdtool', args);

  p.stdout.on('data', function (chunk) {
    stdout.push(chunk);
  });

  p.stderr.on('data', function (chunk) {
    stderr.push(chunk);
  });

  p.on('close', function (code) {

    if (code !== 0) {
      var str = Buffer.concat(stderr).toString();
      var err = new Error(str.replace(/^ERROR: /, ''));

      return cb(err);
    }

    cb(null, Buffer.concat(stdout).toString());
  });

}

exports.create = function (file, opts, args, cb) {

  var a = [];

  if (opts.start) {
    a.push('--start');
    // rrdtool dosen't allow inserting a value onto
    // the start date. Decrese it by one so we can do that.
    a.push('' + (opts.start - 1));
  }

  if (opts.step) {
    a.push('--step');
    a.push('' + opts.step);
  }

  if (opts.force !== true) {
    a.push('--no-overwrite');
  }

  exec(['create', file].concat(a).concat(args), function (err) {
    cb(err);
  });
};

exports.info = function (file, cb) {
  exec(['info', file], function (err, out) {
    if (err) { return cb(err); }

    var info = { ds: [], rra: [] };

    var reDs = /ds\[([a-zA-Z0-9_]+)\].type = "([A-Z]+)"/g;
    var reRra = /rra\[([0-9]+)\].cf = "([A-Z]+)"/g;

    out.replace(reDs, function (m0, m1, m2) {
      info.ds.push({ name: m1, type: m2 });
    });

    out.replace(reRra, function (m0, m1, m2) {
      info.rra.push({ cf: m2 });
    });

    cb(null, info);
  });
};

exports.update = function (file, ts, values, cb) {

  var template = [];
  var cmd = [ts];

  Object.keys(values).forEach(function (key) {
    template.push(key);
    cmd.push(values[key]);
  });

  exec(['update', file, '--template', template.join(':'), cmd.join(':')], function (err) {
    cb(err);
  });
};

exports.fetch = function (file, cf, start, stop, res, dae, cb) {

  var args = ['fetch', file, cf];

  // rrdtool counts timestamp very strange, hence the -1
  args.push('--start', '' + (start - 1));
  args.push('--end', '' + (stop - 1));

  if (res !== null) {
    args.push('--resolution', '' + res);
  }

  if (dae !== null) {
    args.push('--daemon', '' + dae);
  }

  exec(args, function (err, data) {
    if (err) { return cb(err); }

    function parseRow (str) {
      var m = str.split(':');

      return {
        time: Number(m[0]),
        values: m[1].trim().split(/ +/).reduce(function (p, c, i) {
          p[header[i]] = (c.trim() === 'nan' ? null : Number(c));
          return p;
        }, {})
      };
    }

    var lines = data.trim().split('\n');
    var header = lines[0].trim().split(/ +/);
    var rows = lines.slice(2).map(parseRow);

    cb(null, rows);
  });
};

exports.dump = function (file, cb) {
  exec(['dump', file], cb);
};
