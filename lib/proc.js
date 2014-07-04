
var child_process = require('child_process');

function exec (args, cb) {

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

exports.create = function (file, args, cb) {
  exec(['create', file].concat(args), function (err) {
    cb(err);
  });
};

exports.info = function (file, cb) {
  exec(['info', file], function (err, out) {
    if (err) { return cb(err); }

    var info = { ds: {}, rra: [] };

    var reDs = /ds\[([a-zA-Z0-9_]+)\].type = "([A-Z]+)"/g;
    var reRra = /rra\[([0-9]+)\].cf = "([A-Z]+)"/g;

    out.replace(reDs, function (m0, m1, m2) {
      info.ds[m1] = { type: m2 };
    });

    out.replace(reRra, function (m0, m1, m2) {
      info.rra.push({ cf: m2 });
    });

    cb(null, info);
  });
};

exports.update = function (file, name, value) {
  exec(['update', file, '--template', name, 'N:' + value], function (err) {
    cb(err);
  });
};
