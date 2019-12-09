
var express = require('express');

var _fs = require('fs');
var fs = require('../fs');
var path = require('../path');
var Fiber = require('fibers');
var Page = require('./Page');
var util = require('./util');
var globals = require('./globals');
var wrap = require('./wrap');
var routeUtils = require('./routeUtils');
var srcrouter = require('../root/srcrouter')('client');
var cssrouter = require('fusion/root/cssrouter');

var fusionClientCode = _fs.readFileSync(__dirname+'/../client/fusion.js');

function PluginRouter() {
  this.router = express.Router();

  this.name = 'plugin';
  this.dirs = {get: {}, post: {}, api: {}};
  this.routes = {get: {}, post: {}, api: {}};
  this.routeIndex = {get:{}, post:{}};

  this.resources = [];

  // Load in get routes
  this.config = {defaultApp: 'index'};

  // Fusion client-side code
  this.router.get('/fusion/fusion.js',function (req,res) {
    res.setHeader('Content-Type','text/javascript');
    res.send(fusionClientCode);
  });

  // All routes pass through the same handler
  this.router.get('/favicon.ico',function(req,res) {
    res.status(404).send('');
  });

  // Add source router
  this.router.get('/scripts/*',this.fiberizeCustomRoute({main: srcrouter},'srcrouter','get'));

  // Add style routers
  this.router.get('/style/*',this.fiberizeCustomRoute({main: cssrouter.route},'cssrouter','get'));
  this.router.get('/css/*',this.fiberizeCustomRoute({main: cssrouter.route},'cssrouter','get'));

  // All routes pass through the same handler
  var route = this.fiberizeCustomRoute(this,'index','get');
  this.router.get('/',route);
  this.router.get('/data/*',route);
}

PluginRouter.prototype.main = function($P) {
  var url = $P.req.url.indexOf('/data') == 0 ? $P.req.url.slice(6) : 'index';

  var dataPath = path.join(rootDir,'routes','data',url)+'.json';
  if (fs.exists(dataPath)) $P.exports.importedMediaData = JSON.parse(fs.readFile(dataPath));
  $P.render();
}

PluginRouter.prototype.fiberizeCustomRoute = function(script,name,verb) {
  var self = this;
  return function (req,res) {
    var fiber = Fiber(function() {
      var $P = new Page(verb,name,req,res,self);
      routeUtils.executeRoute($P,script);
    });

    fiber.run();
  }
}

module.exports = new PluginRouter();

