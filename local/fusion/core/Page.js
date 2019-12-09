                             
var path = require('path');
var globals = require('./globals');
var clone = require('../clone');

var Exports = function() {

}

Exports.prototype.extend = function(obj,autoEncode) {
  if (autoEncode == null) autoEncode=true;
  for (var k in obj) {
    this[k] = obj[k];
  }
}

var ExportData = function() {
  this.data = null;
  this.type = null;
}

var ExportVData = function() {
  this.data = [];
}

function stringifyData(obj) {
  if (obj.type)
    return 'fs.transpose('+JSON.stringify(obj.data)+','+obj.type+')'
  else return 'fs.transpose('+JSON.stringify(obj.data)+')';
}

function stringifyVData(vdata) {
  if (typeof vdata == 'array') {
    var result = '[';
    for (var k in vdata) {
      result += stringifyData(vdata[k])+',';
    }
    return result.substr(0,result.length-1)+']';  
  } else if (typeof vdata == 'object') {
    var result = '{';
    for (var k in vdata) {
      result += k+':'+stringifyData(vdata[k])+',';
    }
    
    if (result.length > 1)
      return result.substr(0,result.length-1)+'}'
    else return '{}';
  }
}

function exportsToString(exports) {
  var result = '';
  var count = 0;
  for (var k in exports) {
    if (k != 'extend') {
      // Case 1: The export value has been wrapped with the ExportData class
      //   which means that it will be passed to fs.transpose immediately
      //   on the client side
      if (exports[k] instanceof ExportData) {
        result += '_.'+k+' = '+stringifyData(exports[k])+';';
      // Case 2: The export values are part of an array or object and will
      //   be passed to the 
      } else if (exports[k] instanceof ExportVData) {
        result += '_.'+k+' = '+stringifyVData(exports[k].data)+';';
      } else {
        result += '_.'+k+' = '+JSON.stringify(exports[k])+';';
      }
      count++;
    }
  }
  
  return result;
}

var Page = function(verb,name,req,res,router) {
  this.verb = verb;
  this.name = name;
  this.req = req;
  this.res = res;
  this.router = router;
  this.exports = new Exports();
  this.mode = 'dynamic';
  this.content = '';
  this.scripts = [];
  this.styles = [];
  this.cache = {};
  this.views = globals.templates;

  this.require = new globals.require(this);
}

Page.prototype.write = function(str) {
  this.content += str;
}

Page.prototype.generateHTML = function(template,config) {
  config = config || {};

  // If this is the GET index route and we have tabRoutes, we need to pass
  // write them into the data of the page
  if ((this.name == 'index.js') && (this.verb == 'get') && this.router && this.router.config.tabRoutes)
    this.exports.tabRoutes = this.router.config.tabRoutes;

  // Export the csrf_token
  this.exports.csrf_token = this.csrfToken;

  // Note that `bindData` causes everything in the data directory to be declared
  // before any data is imported. This is in case any data models need to be
  // instantiated early with the incoming data.
//  var exportsScript = '<script type="text/javascript">var data = require("data"); function bindData(_){'
  var exportsScript = '<script type="text/javascript">function bindData(_){'
    +exportsToString(this.exports)+'}</script>';

  var pageScript = '<script type="text/javascript">';
  switch(this.mode) {
    case 'dynamic':
      pageScript += '$(document).ready(function(){fs.run(\''+path.basename(this.name,'.js')+'\');';

//      bindLogoutScript();
//      pageScript += '$(document).ready(function(){bindLogoutScript();';
//      pageScript += 'window.pageName = \''+this.name+'\'; window.page=require(\'page/'+path.basename(this.name,'.js')+'\');run();';
    break;
    case 'static':
      pageScript += '$(document).ready(function(){fs.run();';
//      pageScript += '$(document).ready(function(){bindLogoutScript();';
//      pageScript += 'alwaysRun();';
    break;
  }
  pageScript += '});</script>';

  if (!template) template = globals.templates[this.router.config.defaultApp];

  var PageConfig = globals.pageConfig;
  var pageConfig = new PageConfig(this,template.src);
  pageConfig.styles = template.styles;
  pageConfig.scripts = template.scripts;
  pageConfig.exportsScript = exportsScript;
  pageConfig.pageScript = pageScript;

  // Add any config variable overrides
  for (var k in config)
    pageConfig[k] = config[k];

  // Make sure the "content" variable is present
  pageConfig.content = pageConfig.content || '';

  return template.jade(pageConfig);
}

Page.prototype.render = function(template,config) {

  // Session data has to be persisted before data is sent with res.send (b/c
  // res.send terminates the request)
  this.persist();

  // Render page and send it
  this.res.send(this.generateHTML(template,config));
}

function generateHTTPError(status) {
}

Page.prototype.error = function(errorObj,type) {
  if (typeof errorObj == 'number') {

    var httpStatus = errorObj;
    return function(errorObj,type) {
      if (typeof errorObj == 'string') throw new Error('Invalid error object '+errorObj);
      errorObj.type = type || 'Generic Error';
      errorObj.tellUser = true;
      errorObj.httpStatus = httpStatus;
      throw errorObj;
    }
  } else {
    if (typeof errorObj == 'string') throw new Error('Invalid error object '+errorObj);

    errorObj.type = type || 'Generic Error';
    errorObj.tellUser = true;
    throw errorObj;
  }
}

Page.prototype.assert = function(cond,errorObj,type) {
  var self = this;

  if (typeof cond == 'number') {
    var httpStatus = cond;
    return function(cond,errorObj,type) {
      if (!cond) self.error(httpStatus)(errorObj,type);
    }
  } else if (!cond) this.error(errorObj,type);
}
  
Page.prototype.json = function(JSON) {
  JSON.success = 1;
  this.persist();
  this.res.json(JSON);
}
  
Page.prototype.created = function(JSON) {
  JSON.success = 1;
  this.persist();
  this.res.json(JSON,201);
}

Page.prototype.deleted = function() {
  this.persist();
  this.res.json({},204);
}

Page.prototype.data = function(obj,type) {
  var result = new ExportData();
  result.data = obj;
  result.type = type;
  return result;
}
  
Page.prototype.vdata = function(obj) {
  var result = new ExportVData();
  result.data = obj;
  return result;
}
  
Page.prototype.clear = function() {
  var vars = clone(globals.persistVars);
  for (var k in vars)
    this[k] = vars[k];
}

Page.prototype.persist = function() {
  var store = {};
  var vars = globals.persistVars;
  var hasVars = false;
  for (var k in vars) {
    store[k] = this[k];
    hasVars = true;
  }

  // Save session data
  if (hasVars) this.req.session.store = store;
}

module.exports = Page;

