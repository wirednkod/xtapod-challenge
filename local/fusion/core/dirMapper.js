
var fs = require('fs');
var path = require('path');

exports.loadModules = function(exports,dirname) {
  var dirs = fs.readdirSync(dirname);
  for (var k in dirs) {
    if (dirs[k] != 'index.js') {
      if (~dirs[k].indexOf('.js')) exports[path.basename(dirs[k],'.js')] = require(dirname+'/'+dirs[k]);
    }
  }
}

