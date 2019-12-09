   
var fs = require('fs');
var Fiber = require('fibers');

// The sync functions are included exactly, everything else is fiberized
exports.renameSync = fs.renameSync;
exports.ftruncateSync = fs.ftruncateSync;
exports.truncateSync = fs.truncateSync;
exports.chownSync = fs.chownSync;
exports.fchownSync = fs.fchownSync;
exports.lchownSync = fs.lchownSync;
exports.chmodSync = fs.chmodSync;
exports.fchmodSync = fs.fchmodSync;
exports.lchmodSync = fs.lchmodSync;
exports.statSync = fs.statSync;
exports.lstatSync = fs.lstatSync;
exports.fstatSync = fs.fstatSync;
exports.linkSync = fs.linkSync;
exports.symlinkSync = fs.symlinkSync;
exports.readlinkSync = fs.readlinkSync;
exports.realpathSync = fs.realpathSync;
exports.unlinkSync = fs.unlinkSync;
exports.rmdirSync = fs.rmdirSync;
exports.mkdirSync = fs.mkdirSync;
exports.readdirSync = fs.readdirSync;
exports.closeSync = fs.closeSync;
exports.openSync = fs.openSync;
exports.utimesSync = fs.utimesSync;
exports.futimesSync = fs.futimesSync;
exports.fsyncSync = fs.fsyncSync;
exports.writeSync = fs.writeSync;
exports.readSync = fs.readSync;
exports.readFileSync = fs.readFileSync;
exports.writeFileSync = fs.writeFileSync;
exports.appendFileSync = fs.appendFileSync;
exports.existsSync = fs.existsSync;


exports.rename = function(oldPath,newPath) {
  // Lowercase "fiber" will now reference the currently running fiber 
  var fiber = Fiber.current;
  var E = null;

  fs.rename(oldPath,newPath,function(err) {
    E = err;

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  if (!E) return true 
  else throw new Error(E);
}

exports.exists = function(filename) {
  // Lowercase "fiber" will now reference the currently running fiber 
  var fiber = Fiber.current;
  var exists = null;

  fs.exists(filename,function(result) {
    exists = result;

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  return exists;
}

exports.mkdir = function(dirname,mode) {
//  mode = mode || 777;
  // Lowercase "fiber" will now reference the currently running fiber
  var fiber = Fiber.current;
  var E = null;

  fs.mkdir(dirname,mode,function(err) {
    E = err;

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  if (!E) return true 
  else throw new Error(E);
}

exports.stat = function(filename) {
  // Lowercase "fiber" will now reference the currently running fiber 
  var fiber = Fiber.current;
  var E = null;
  var res = null;
  
  fs.stat(filename,function(err,stats) {
    E = err;
    res = stats;

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  if (!E) return res 
  else throw new Error(E);
}

exports.open = function(path,flags,mode) {
  // Lowercase "fiber" will now reference the currently running fiber 
  var fiber = Fiber.current;
  var E = null;
  var FD = null;
  
  fs.open(path,flags,mode,function(err,fd) {
    E = err;
    FD = fd;

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  if (!E) return FD 
  else throw new Error(E);
}

exports.close = function(fd) {
  // Lowercase "fiber" will now reference the currently running fiber 
  var fiber = Fiber.current;
  var E = null;
  
  fs.close(fd,function(err) {
    E = err;

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  if (!E) return true 
  else throw new Error(E);
}

exports.write = function(fd, buffer, offset, length, position) {
  // Lowercase "fiber" will now reference the currently running fiber 
  var fiber = Fiber.current;
  var E = null;
  
  fs.write(fd, buffer, offset, length, position, function(err,written,buffer) {
    E = err;

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  if (!E) return true 
  else throw new Error(E);
}

exports.appendFile = function(filename, data, encoding) {
  // Lowercase "fiber" will now reference the currently running fiber
  var fiber = Fiber.current;
  var E = null;

  fs.appendFile(filename, data, {encoding:encoding}, function (err) {
    E = err;

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  if (!E) return true
  else throw new Error(E);
}

exports.writeFile = function(filename, data, encoding) {
  // Lowercase "fiber" will now reference the currently running fiber 
  var fiber = Fiber.current;
  var E = null;
  
  fs.writeFile(filename, data, {encoding:encoding}, function(err) {
    E = err;

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  if (!E) return true 
  else throw new Error(E);
}

exports.read = function(fd, buffer, offset, length, position) {
  // Lowercase "fiber" will now reference the currently running fiber
  var fiber = Fiber.current;
  var E = null;
  var res = null;

  fs.read(fd,buffer,offset,length,position,function(err,bytesRead,buffer) {
    E = err;
    res = buffer;

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  if (!E) return res
  else throw new Error(E);
}

exports.readFile = function(filename, encoding) {
  // Lowercase "fiber" will now reference the currently running fiber 
  var fiber = Fiber.current;
  var E = null;
  var res = null;
  
  fs.readFile(filename, {encoding:encoding}, function(err,data) {
    E = err;
    res = data;

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  if (!E) return res 
  else throw new Error(E);
}

exports.readdir = function(path) {
  // Lowercase "fiber" will now reference the currently running fiber 
  var fiber = Fiber.current;
  var E = null;
  var res = null;
  
  fs.readdir(path,function(err,files) {
    E = err;
    res = files;
    
    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  if (!E) return res 
  else throw new Error(E);
}

exports.unlink = function(path) {
  // Lowercase "fiber" will now reference the currently running fiber 
  var fiber = Fiber.current;
  var E = null;
  
  fs.unlink(path,function(err) {
    E = err;
    
    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  if (!E) return true 
  else throw new Error(E);
}

exports.rmdir = function(path) {
  // Lowercase "fiber" will now reference the currently running fiber
  var fiber = Fiber.current;
  var E = null;

  fs.rmdir(path,function(err) {
    E = err;

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since fs access is slow!
  Fiber.yield();

  // This doesn't happen until the callback calls fiber.run() above.
  if (!E) return true
  else throw new Error(E);
}

exports.isDir = function(name) {
  var stat = exports.stat(name);
  stat.isDirectory();
}

