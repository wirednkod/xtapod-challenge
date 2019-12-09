

var fusion = require('fusion');
var Fiber = require('fibers');

exports.run = function(routesDir) {
  if (process.argv.length > 2) {
    var job = process.argv[2];
    var script = require(rootDir+routesDir+job+'.js');
    var fiber = Fiber(function() {
      // Set up the basic job object
      $J = {};
      $J.name = job;

      // Run job
      script.main($J);

      // End job
      process.exit();
    });

    fiber.run();
  } else {
    console.log('No job specified. Exiting.');
  }
}

