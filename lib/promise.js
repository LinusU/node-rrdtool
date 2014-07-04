
function Promise () {
  this.status = 'init';
  this.value = [undefined, undefined];
  this.queue = [];
}

Promise.prototype.then = function (cb) {
  if (this.status === 'init') {
    this.queue.push(cb);
  } else {
    cb(this.value[0], this.value[1]);
  }
};

Promise.prototype.resolve = function (err, res) {
  this.status = 'done';
  this.value = [err, res];
  this.queue.forEach(function (fn) { fn(err, res); });
  this.queue = [];
};

module.exports = exports = Promise;
