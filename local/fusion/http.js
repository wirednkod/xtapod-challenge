
/* This module needs some additional testing and work before it's considered
   production quality, but it works for now */

var Fiber = require('fibers');

var request = require('request');

// This should pay attention to status codes!!!!!
// This should pay attention to status codes!!!!!
// This should pay attention to status codes!!!!!
// This should pay attention to status codes!!!!!
exports.get = function(url, options) {
  // Lowercase "fiber" will now reference the currently running fiber
  var fiber = Fiber.current;
  var result = null;
  var E = null;

  var opts = {};
  if(options) {
    opts = options;
  }
  opts.url = url;

  request(opts,function (error, response, body) {
    if (error) {
      E = error;
    } else if (response.statusCode == 200) {
      result = body;
    }

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since http requests are slow
  Fiber.yield();

  if (!E) return result
  else throw new Error(E);
}

exports.getx = function(url, options) {
  // Lowercase "fiber" will now reference the currently running fiber
  var fiber = Fiber.current;
  var result = null;
  var E = null;

  var opts = {};
  if(options) {
    opts = options;
  }
  opts.url = url;

  request(opts,function (error, response, body) {

    if (error) {
      E = error;
    } else {
      result = {
        response: response,
        body: body
      }
    }

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since http requests are slow
  Fiber.yield();

  if (!E) return result
  else throw new Error(E);
}

// This should pay attention to status codes!!!!!
// This should pay attention to status codes!!!!!
// This should pay attention to status codes!!!!!
// This should pay attention to status codes!!!!!
exports.post = function(url,args) {
  // Lowercase "fiber" will now reference the currently running fiber
  var fiber = Fiber.current;
  var result = null;
  var E = null;
  var hasYielded = false;

//  request.post(url, args, function (error, response, body) {
  request.post(url, {form:args}, function (error, response, body) {
//    console.log('ERROR='+response);
    if (error) {
      E = error;
    } else if (response.statusCode == 200) {
      result = body;
    }

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    if (hasYielded) fiber.resume();
    hasYielded = true;
  });

  // Yield so the server can do something else, since http requests are slow
  if (!hasYielded) {
    hasYielded = true;
    Fiber.yield();
  }

  if (!E) return result
  else throw new Error(E);
}

exports.request = function(options) {
  // Lowercase "fiber" will now reference the currently running fiber
  var fiber = Fiber.current;
  var result = null;
  var E = null;

  request(options,function (error, response, body) {

    if (error) {
      E = error;
    } else {
      result = {
        response: response,
        body: body
      }
    }

    // This kicks the execution back to where the Fiber.yield() statement stopped it
    fiber.resume();
  });

  // Yield so the server can do something else, since http requests are slow
  Fiber.yield();

  if (!E) return result
  else throw new Error(E);
}

