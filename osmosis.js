
// Add local modules
require('app-module-path').addPath('local');

// The basics
var express = require('express');
var fusion = require('fusion');
var path = require('path');

// Framework TODO: This probably shouldn't be global
global.live = Const.live;

// Better debug messages
require('debug-trace')({
  always: true,
});

// Default 3rd party middleware
var logger = require('morgan');

// Osmosis framework configuration
var framework = require('./framework');

// The server
var http = require('http');

// Create the express.js app
var app = express();

// Port the server listens on locally
app.set('port', Const.port);
app.use(logger('dev'));

fusion.configure(framework);

// URL routing
app.use(fusion.plugin());

// Client-side scripts
app.use(express.static(path.join(__dirname, 'client')));

var server = http.createServer(app);

server.listen(app.get('port'),'localhost', function() {
  console.log('listening on port '+app.get('port'));

  // The uncaughtException handler makes sure that an uncaught error cannot
  // bring down the server. The uncaughtException handler is added after the
  // server starts listening just in case that another process is already running
  process.addListener("uncaughtException", function (err) {
    console.error("Uncaught exception: " + err.message);
    console.error(err.stack);
  });

  // Pre-load all methods so that the user doesn't have to wait
  fusion.preload();

  console.log('Ready');
});
