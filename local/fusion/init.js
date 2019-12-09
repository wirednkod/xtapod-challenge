
var sleep = require('./sleep');

module.exports = function(init) {
  var initialized = false;
  var initalizing = false;
  return function(options) {
    // Check to see if we should refresh
    options = options || {};
    if (options.refresh) {
      while (initalizing) sleep(500);
      initialized = false;
    }

    // Initalize
    if (!initialized) {
      if (!initalizing) {
        initalizing = true;
        init();
        initalizing = false;
        initialized = true;
      } else while (initalizing) sleep(500);
    }
  }
}

