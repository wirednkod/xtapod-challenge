
var http = require('http-get');
var Fiber = require('fibers');

exports.get = function(options) {
  var fiber = Fiber.current;

  options.timeout = options.timeout || 10000;

  var E = null;
  var buf = null;
  http.get(options, function (error, result) {

    E = null;
    if (error) E = error;
    else buf = result.buffer;

    fiber.resume();
  });

  // Yield so the server can do something else, since http requests are slow
  Fiber.yield();

  if (!E) return buf
  else throw new Error(E);
}

