
var less = require('less');
var Fiber = require('fibers');

exports.compile = function(src,options) {
  options = options || {};

  var parser = new(less.Parser)(options);

  // Lowercase "fiber" will now reference the currently running fiber
  var fiber = Fiber.current;
  var E = null;
  var res = null;
  var status = 'pre';
  parser.parse(src,function(err,tree) {
    E = err;

    if (!err) {
      res = tree.toCSS();
    }

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    if (status == 'yield') fiber.resume();
    status = 'returned';
  });

  // Yield so the server can do something else, since fs access is slow!
  if (status == 'pre') {
    status = 'yield';
    Fiber.yield();
  }

  if (!E) return res
  else throw new Error(E);
}

