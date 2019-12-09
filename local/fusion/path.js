
var path = require('path');

// Import the native path functions
exports.normalize = path.normalize;
exports.join = path.join;
exports.resolve = path.resolve;
exports.relative = path.relative;
exports.dirname = path.dirname;
exports.basename = path.basename;
exports.extname = path.extname;
exports.ext = function(filename) {
  return path.extname(filename).slice(1);
}
exports.sep = path.sep;

exports.parts = function(filename) {
  var ext = path.extname(filename);
  return {
    dir:path.dirname(filename),
    name:path.basename(filename,ext),
    ext: ext.slice(1).toLowerCase(),
  }
}

exports.filename = function(filename) {
  return exports.basename(filename,'.'+exports.extname(filename));
}

exports.filter = function(filename) {
  return filename.replace(/[^A-Za-z0-9\-\.]/g,'_');
}

exports.isSafe = function(filename) {
  var parts = filename.split('/');
  var safe = true;
  for (var k in parts) {
    if (parts[k])
      safe = safe && /^([A-Za-z0-9_-]+\.?)+$/.test(parts[k]);
  }
  return safe;
}

exports.valid = function(filename,failOnInvalid) {
  var test = filename.replace(/[^A-Za-z0-9\-\.\_\~\'%\(\)\:\/]/g,'_');
  if (test != filename) {
    if (failOnInvalid) 
      throw new Error('Filename not valid.')
    else return false;
  } else return true;
}

exports.validate = function(filename) {
  return exports.valid(filename,true);
}
