
// Root contains the full path of root directory of the server. It is the
//   most fundamental variable of the app and is therefore declared as a global.
global.rootDir = (process.cwd()+'/').replace(/\\/g,'/');
//global.root = (process.cwd()+'/').replace(/\\/g,'/'); // Deprecated

// Workaround for isomorphic modules
global.isServerSide = true;

// Load in config variables
var fs = require('fs');
var path = require('path');

// Config file
global.live = false;
global.Const = {
  port: 3005,
  cookieSecret:'cookie-secret-here',
  DBUsername:'root',
  DBPassword:'sql-password',
  cache: '',
  bundled: false,
  nodeDir: rootDir+'node/',
}

// Build filename
Const.includes = {};

// Create resume method on main Fiber class
var Fiber = require('fibers');
Fiber.prototype.resume = function(args) {
  if (this.started) return this.run(args);
}

// Required modules
var path = require('path');
var Router = require('./core/Router');
var WebTemplate = require('./core/WebTemplate');
var cron = require('./core/cron');
var globals = require('./core/globals');
var datefmt = require('dateformat');
var lessParser = require('./core/css/less');
var cssParser = require('./core/css/css');
var src = require('./core/src');
var plugin = require('./core/plugin');
datefmt.masks.sql = 'yyyy-mm-dd HH:MM:ss';

function mergeSrcCSSIncludes(src) {
  if (!('less' in src))
    src.less = [];
  for (var k in src.style) {
    src.less.push(src.style[k]);
  }
  delete src.style;
}

exports.loadSources = function(config) {

  // Load in assets
  globals.assets = {};
  if (fs.existsSync(rootDir+'includes/public.assets')) {
    var assets = JSON.parse(fs.readFileSync(rootDir+'includes/public.assets','utf-8'));
    for (var k in assets) {
      globals.assets[assets[k].name] = assets[k].key;
    }
  }
}

function readAssetsDir(include,assets,assetMap,base,dir) {
  dir = dir || '';

  var files = fs.readdirSync(base+dir);
  for (var k in files) {
    var stat = fs.statSync(base+dir+'/'+files[k]);

    if (!stat.isDirectory()) {
      // Skip this file if the extension isn't in assets.include
      var ext = path.extname(files[k]);
      if (!include[ext]) continue;

      // Make sure asset filename is valid
      if (files[k].search(' ') != -1)
        throw new Error('Asset files cannot contain spaces: '+files[k]);

      // Register the asset if it does not already exist
      var assetName = '/assets'+path.join(dir,files[k]);
      if (!assetMap[assetName])
        assets.push({
          name: assetName,
        });
    } else readAssetsDir(include,assets,assetMap,base,dir+'/'+files[k]);
  }
}

exports.registerAssets = function(assets,assetMap) {
  // Load the assets.include file
  if (fs.existsSync(rootDir+'includes/assets.include')) {
    var include = {};
    var lines = fs.readFileSync(rootDir+'includes/assets.include','utf-8').split('\n');
    for (var k in lines) {
      if (lines[k].length > 0 && lines[k][0] != '#')
        include[lines[k]] = true;
    }
  } else throw new Error('assets.include file not found. Nothing will be included!');

  // Make sure the client/assets directory exists
  if (!fs.existsSync(rootDir+'client/assets'))
    throw new Error('No client/assets directory to read from.');

  // Loop through the client/assets directory
  readAssetsDir(include,assets,assetMap,rootDir+'client/assets');

  // Load in assets from css files
  var ignored = {};
  var sources = src.lib;
  for (var k in sources) {

    // Extract urls from any css or less files
    var urls = [];
    if ('css' in sources[k])
      cssParser.build(sources[k].css,urls)
    else if ('less' in sources[k])
      cssParser.parseLessURLs(lessParser.build(sources[k].less),urls);

    // Loop through the extracted urls and add them to the assets list
    for (var k in urls) {
      if (fs.existsSync(rootDir+'client'+urls[k])) {
        var stat = fs.statSync(rootDir+'client'+urls[k]);
        if (!stat.isDirectory()) {
          if (!assetMap[urls[k]]) {
            assets.push({
              name: urls[k],
            });
            assetMap[urls[k]] = true;
          }
        }
      } else ignored[urls[k]] = true;
    }
  }

  // Report any ignored source files
  var count = 0;
  for (var k in ignored) {
    console.log('??? '+k);
    count++;
  }
  console.log('Ignored '+count+' urls.');

  return assets;
}

exports.preload = function() {
  var routers = globals.routers;
  for (var k in routers)
    routers[k].load();
}

exports.boot = function(config) {
  config = config || {};

  // Copy config variables to globals
  for (var k in config)
    globals[k] = config[k];

  // Load request handler
  var request = require(path.join(rootDir,'request'))

  // Default page mixins
  var defaultPageMixins = [
    'mixin img(tag)',
    '  !=img(attributes)',
    'mixin src(tag)',
    '  !=src(attributes)',
  ].join('\n')+'\n';

  // Load core globals
  globals.require = require(path.join(rootDir,'request','roles'));
  globals.pageConfig = require(path.join(rootDir,'request','page'));
  globals.pageMixins = fs.existsSync(path.join(rootDir,'request','page.jade')) ? defaultPageMixins+fs.readFileSync(path.join(rootDir,'request','page.jade')) : defaultPageMixins;
  globals.requestHandler = request;
  globals.sync = require(path.join(rootDir,'request','sync'));

  // Create web routers
  var routers = {};
  globals.routers = routers;
  for (var k in config.web) {
    routers[config.web[k]] = new Router(config.web[k],path.join('routes',config.web[k]),request);
    routers[config.web[k]].configure();
  }

  // Load in all paths to sources
  exports.loadSources(config);

  // Load in all web apps
  var dir = fs.readdirSync(rootDir+'templates');
  for (var k in dir) {
    if (path.extname(dir[k]) == '.jade') {
      var name = path.basename(dir[k],'.jade');

      globals.templates[name] = new WebTemplate(config,fs.readFileSync(rootDir+'templates/'+dir[k],'utf8'));
    }
  }
}

exports.configure = function(config) {
  // Boot the framework
  exports.boot(config);

  // Set up cron
  if (config.routes.cron) cron.configure(path.join('routes',config.routes.cron));
}

exports.router = function(name) {
  return globals.routers[name].router;
}

exports.plugin = function() {
  return plugin.router;
}

