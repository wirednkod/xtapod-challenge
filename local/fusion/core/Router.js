
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

function Router(name,dir,request) {
  this.router = express.Router();

  // Framework TODO: The object that is assigned here should really be a subclass of Router
  this.request = request;

  this.name = name;
  this.dirs = {get: {}, post: {}, api: {}};
  this.routes = {get: {}, post: {}, api: {}};
  this.routeIndex = {get:{}, post:{}};

  this.resources = [];

  // Load in get routes
  this.config = require(rootDir+dir);
  console.log(this.config.tabRoutes);
  this.config.tabRoutes = getTabRoutes(path.join(rootDir,'client',this.config.tabRoutes));

  // Load in get routes
  if (_fs.existsSync(rootDir+dir+'/get'))
    addRouteDir(this.dirs.get,rootDir+dir+'/get');

  // Load in post routes
  if (_fs.existsSync(rootDir+dir+'/post'))
    addRouteDir(this.dirs.post,rootDir+dir+'/post');

  // Load in the api routes
  if (_fs.existsSync(rootDir+dir+'/rest')) {
    addAPIDir(this.dirs.api,this.resources,'/api/'+Const.api,rootDir+dir+'/rest');
    this.api(path.join(dir,'rest'));
  }
}

function addTabDir(tabs,base,dir) {
  dir = dir || '';

  var files = _fs.readdirSync(base+dir);
  for (var k in files) {
    var stat = _fs.statSync(base+dir+'/'+files[k]);
    var ext = path.extname(files[k]);

    if (stat.isDirectory()) {
      addTabDir(tabs,base,dir+'/'+files[k])
    } else if (ext == '.js') {
      var name = path.basename(files[k],'.js');
      if (name == 'index')
        tabs.push(path.join(dir,'/'))
      else
        tabs.push(path.join(dir,name));
    }
  }
}

function getTabRouteDir(routeDir) {
  var tabs = [];
  addTabDir(tabs,routeDir,'/');
  return tabs;
}

function getTabRoutes(routeDir) {
  if (!routeDir || !_fs.existsSync(routeDir)) return {};

  var dirs = _fs.readdirSync(routeDir);
  var routes = {};
  for (var k in dirs)
    routes[dirs[k]] = getTabRouteDir(path.join(routeDir,dirs[k]));

  return routes;
}

function getBaseFilename(filename) {
  if (path.basename(filename) != 'index.js')
    return path.dirname(filename)+path.basename(filename,'.js');
  else return path.dirname(filename);
}

Router.prototype.fiberize = function(verb,name) {
  var self = this;
  return function (req,res) {
    var fiber = Fiber(function() {
      var $P = new Page(verb,name.slice(1)+'.js',req,res,self);
      var script = self.getBasicRouteScript(verb,name);
      routeUtils.executeRoute($P,script);
    });

    fiber.run();
  }
}

Router.prototype.fiberizeCustomRoute = function(script,name,verb) {
  var self = this;
  return function (req,res) {
    var fiber = Fiber(function() {
      var $P = new Page(verb,name,req,res,self);
      routeUtils.executeRoute($P,script);
    });

    fiber.run();
  }
}

var api = {};
var apiScripts = {};
var methodMap = {'GET':'read', 'POST':'create', 'PUT': 'update', 'DELETE':'destroy'};

// Get the model key
function getModelKeyName(key) {
  for (var k in key) return k;
}

function extractValues(model,args) {
  var fields = [];
  var data = [];
  for (var k in model) {
    fields.push(k);
    if (model[k].type == 'document' || model[k].type == 'object') data.push(JSON.stringify(args[k]))
    else data.push(args[k]);
  }
  return {fields:fields,data:data};
}

Router.prototype.getBasicRouteScript = function(verb,moduleName) {
  var script = this.routes[verb][moduleName];
  if (!script) {
    script = require(this.dirs[verb][moduleName]);
    this.routes[verb][moduleName] = script;
  }
  return script;
}

function apiDefs(routeDir) {
  var self = this;
  return function (req,res) {
    var fiber = Fiber(function() {
      var url = req.params[0];

      // Set up the basic page object
      var $P = new Page('get','',req,res,self);

      // Check to make sure we're dealing with a safe url
      $P.assert(url && path.isSafe(url),new Error('Invalid request.'));

      $P.res.setHeader('Content-Type','text/javascript');

      $P.res.send(wrap.model(url,routeDir));

    }).run();
  }
}

Router.prototype.assignRoutes = function(app,verb) {
  var routes = this.dirs[verb];
  for (var k in routes) {
    // Assign a route to its entry point and wrap with a Fiber
    var fiberizedScript = this.fiberize(verb,k);
    this.routeIndex[verb][k] = fiberizedScript;
    this.router[verb](k, fiberizedScript);
  }
}

var fusionClientCode = _fs.readFileSync(__dirname+'/../client/fusion.js');

Router.prototype.configure = function() {
  // Define the route for the fusion client code
  this.router.get('/fusion/fusion.js',function (req,res) {
    res.setHeader('Content-Type','text/javascript');
    res.send(fusionClientCode);
  });

  this.assignRoutes(this.router,'get');
  this.assignRoutes(this.router,'post');

  // Alias any /index routes
  this.aliasIndexRoutes('get',this.dirs.get);
  this.aliasIndexRoutes('post',this.dirs.post);

  // Alias the / route if any tabRoutes are present in order to enable single
  // page navigation for certain routes
  if (this.config.tabRoutes)
    this.aliasTabRoutes(this.config.tabRoutes);

  // Initialize custom routes
  for (var verb in this.config.customRouters) {
    var routes = this.config.customRouters[verb];
    for (var k in routes)
      this.customRoute(verb,k,rootDir+routes[k]);
  }
}

Router.prototype.customRoute = function(verb,route,handler) {
  var script = require(handler);

  // Assign a route to its entry point and wrap with a Fiber
  this.router[verb](route, this.fiberizeCustomRoute(script,route,verb));
}

Router.prototype.assignRouteAliases = function(verb,route,aliases) {
  // Get the previously created wrapped script
  var fiberizedScript = this.routeIndex[verb][route];

  // Assign that route to all the aliases
  for (var k in aliases)
    this.router[verb](aliases[k], fiberizedScript);
}

Router.prototype.api = function(dir) {
  // Check if Const.api exists
  if (!Const.api) throw new Error('To use a RESTful api, you need to define a version number in the config file (e.g., api: \'v0\')');

  // Define the route for api definitions
  this.router.get('/api/'+Const.api+'/*',apiDefs(rootDir+dir));
}

Router.prototype.aliasIndexRoutes = function(verb,routes) {
  var isIndex = /\/index$/;
  for (var k in routes) {
    if (isIndex.test(k)) {
      // Get the previously created wrapped script
      var fiberizedScript = this.routeIndex[verb][k];
      this.router[verb](k.slice(0,k.length-5), fiberizedScript);
    }
  }
}

Router.prototype.aliasTabRoutes = function(tabRoutes) {
  // Use a hash map rather than an array b/c routes may have duplicates that
  // are resolved by client-side handlers. All the server cares about is what
  // routes are valid aliases of /
  var aliasRoutes = {};

  // Loop through all private aliases
  for (var k in tabRoutes) {
    var group = tabRoutes[k];
    aliasRoutes['/'+k] = true;
    for (var j in group) {
      if (k == 'default') aliasRoutes[group[j]] = true
      else aliasRoutes['/'+k+group[j]] = true;
    }
  }

  // Convert the aliasRoutes to an aliases array
  var aliases = [];
  for (var k in aliasRoutes) {
    if (k != '/') {
      // If this is an index route, push an additional /-less route
      if (k[k.length-1] == '/') aliases.push(k.slice(0,k.length-1));

      // Push the route
      aliases.push(k);
    }
  }

  // Create the actual routes
  this.assignRouteAliases('get','/index',aliases);
}

Router.prototype.load = function() {
  var missingRequires = [];

  // Load all get routes
  var get = this.dirs.get;
  for (var k in get) this.getBasicRouteScript('get',k);
  // for (var k in this.routes.get) if (!this.routes.get[k].requires) missingRequires.push('GET '+k);

  // Load all post routes
  var post = this.dirs.post;
  for (var k in post) this.getBasicRouteScript('post',k);
  for (var k in this.routes.post) if (!this.routes.post[k].requires) missingRequires.push('POST '+k);

  if (missingRequires.length) {
    console.log(missingRequires);
    throw new Error((missingRequires.length == 1 ? '1 route is' : missingRequires.length+' routes are')+' missing a requires statement!');
  }
}

function addRouteDir(route,base,dir) {
  dir = dir || '';

  var files = fs.readdirSync(base+dir);
  for (var k in files) {
    var stat = fs.statSync(base+dir+'/'+files[k]);
    var ext = path.extname(files[k]);

    if (stat.isDirectory()) {
      addRouteDir(route,base,dir+'/'+files[k])
    } else if (ext == '.js') {
      route[dir+'/'+path.basename(files[k],'.js')] = path.join(base,dir,files[k]);
    }
  }
}

function addAPIDir(api,resources,prefix,base,dir) {
  dir = dir || '';

  // List all files in the current directory
  var files = fs.readdirSync(base+dir);

  // Either there's an index.js in this directory which means that the directory
  // itself represents a resource and all operations on that resource, or
  // this directory is serving as a grouping of related resources
  if (fs.existsSync(base+dir+'/index.js')) {

    // If the entire directory represents a resource, first add the resource
    // name to the resources list
    resources.push(prefix+dir);

    // Add the path to the resource's main controller module
    api[prefix+dir] = path.join(base,dir,'index.js');

    // Loop through all other files
    for (var k in files) {
      var ext = path.extname(files[k]);
      if (ext == '.js' && files[k] != 'index.js') {
        // Add the path to any additional controllers
        api[prefix+dir+'/'+path.basename(files[k],'.js')] = path.join(base,dir,files[k]);
      }
    }

  // Loop through the directory and add each file or directory as a new api
  // route
  } else {
    for (var k in files) {
      var stat = fs.statSync(base+dir+'/'+files[k]);
      var ext = path.extname(files[k]);

      if (stat.isDirectory()) {
        addAPIDir(api,resources,prefix,base,dir+'/'+files[k])
      } else if (ext == '.js') {
        // Add the path to the controller module
        api[prefix+dir+'/'+path.basename(files[k],'.js')] = path.join(base,dir,files[k]);
      }
    }
  }
}

module.exports = Router;

