
/* This module needs some additional testing and work before it's considered
   production quality, but it works for now */

// We need this to build our post string
var querystring = require('querystring');
var https = require('https');
var urlDecoder = require('url');
var Fiber = require('fibers');

exports.post = function(url,args) {
  console.log('POST '+url)
  url = urlDecoder.parse(url);
  console.log(url.path);
  // Build the post string from an object
  var post_data = JSON.stringify(args);


  console.log(post_data);
  // An object of options to indicate where to post to
  var post_options = {
      host: url.hostname,
      port: url.port || '443',
      path: url.path,
      method: 'POST',
      headers: {
          'Content-Type': 'application/json',
          'Content-Length': post_data.length,
          'User-Agent': 'Mozilla/5.0 (iPad; U; CPU OS 3_2_1 like Mac OS X; en-us) AppleWebKit/531.21.10 (KHTML, like Gecko) Mobile/7B405',
      }
  };

  // Lowercase "fiber" will now reference the currently running fiber
  var fiber = Fiber.current;

  var responseData = '';
  // Set up the request
  var post_req = https.request(post_options, function(res) {
      res.setEncoding('utf8');
      res.on('data', function (chunk) {
        responseData += chunk;
      });

      res.on('end', function () {
        fiber.resume();
      });
  });

  // post the data
  post_req.write(post_data);
  post_req.end();

  Fiber.yield();

  return responseData;
}

