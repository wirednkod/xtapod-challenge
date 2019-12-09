
var exec = require('child_process').exec; 
var url = require('url');
var path = require('./path');
var Fiber = require('fibers');
var escape = require('shell-escape');

var Shell = function() {
  this.pwd = process.cwd();
}

Shell.prototype.constructor = Shell;

Shell.prototype.format = function(cmd,args,options) {
  var self = this;
  if (cmd.search(':') != -1) {
    if (cmd.search(/\:(\w+)/) != -1) {
      return cmd.replace(/\:(\w+)/g, function (txt, key) {
        if (args.hasOwnProperty(key)) {
          return self.escape(args[key]);
        }
        return txt;
      }.bind(this));
    } else return cmd;
  } else {
    for (var k in args) {
      cmd = cmd.replace('?',function() {
        return self.escape(args[k]);
      });
    }
    return cmd;
  }
}

Shell.prototype.escape = function(str) {
  return escape([str]);
}

Shell.prototype.cd = function(dir) {
  this.pwd = dir;
}

Shell.prototype.run = function(cmd,args) {
  if (!args) throw new Error('Shell command arguments should be passed as array.');

  // Lowercase "fiber" will now reference the currently running fiber
  var fiber = Fiber.current;

  // Execute command
  var E = null;
  var res = null;
  var escapedCmd = this.format(cmd,args);
  console.log(escapedCmd);
  var child = exec(escapedCmd, {cwd:this.pwd, maxBuffer: 1024 * 1024 }, function (error, stdout, stderr) {
    if (error !== null) {
      // Pass errors to parent scope so that stack traces are accurate
      E = new Error('command failed: '+escapedCmd+' with error '+error);
    }

    res = ''+stdout;

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else
  Fiber.yield();

  if (!E) return res
  else throw E;
}

Shell.prototype.script = function() {
  if (arguments.length % 2 != 0) process.exit();
  for (var k=0;k<Math.floor(arguments.length/2);k++) {
    this.run(arguments[2*k],arguments[2*k+1]);
  }
}

module.exports = Shell;

