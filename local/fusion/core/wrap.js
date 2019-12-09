
var fs = require('../fs');
var jade = require('jade');
var less = require('./less');
var path = require('path');
var globals = require('./globals');
var PageModel = require('./PageModel');

function getLibName(url) {
  // Determine the lib name
  var name = url.split('.');
  var names = name[0].split('/');
  var libname = '';
  for (var k=0;k<names.length-1;k++) {
    libname += names[k]+'.';
  }
  libname += names[names.length-1];
  return libname;
}

exports.js = function(url,filename) {
  return 'define(\''
    +getLibName(url)
    +'\',function(exports, require, module) {'
    +fs.readFileSync(filename,'utf8')
    +'});';
}

function splitIsoPart(file) {
  var idx = file.indexOf('//#isomorphic');
  if (idx == -1) idx = 0;
  return 'var isServerSide = false; '+file.slice(idx);
}

exports.isojs = function(url,filename) {
  var file = splitIsoPart(''+fs.readFileSync(filename,'utf8'));
  return 'define(\''
    +getLibName(url)
    +'\',function(exports, require, module) {'
    +file
    +'});';
}

exports.jade = function(url,filename) {
  var template = jade.compile(globals.pageMixins+fs.readFileSync(filename,'utf8'),{pretty:false});

  var config = {};
  var pageModel = new PageModel();

  return 'deftmp(\''
    +getLibName(url)
    +'\','
    +JSON.stringify({template:template(pageModel)})
    +');';
}

exports.less = function(url,filename) {
  var prefix = getLibName(url).replace(/\./g,'-');

  var lessSrc = fs.readFile(filename,'utf8');
  return '\n.'+prefix+'{'+lessSrc+'}';
//  return less.compile('.'+prefix+'{'+lessSrc+'}');
}

/*
exports.define = function(routeDir,url) {
  var resource = require(routeDir+'/'+url);

  var apiName = path.basename(url) == 'index.js' ? path.dirname(url) : path.basename(url,'.js');

  var obj = {
    key: resource.key,
    model: resource.model,
    controller: resource.controller,
  };
  if (resource.expects) obj.expects = resource.expects;

  return 'defapi(\''+apiName+'\','+JSON.stringify(obj)+');';
}
*/

exports.model = function(url,route) {
  var name = url.slice(0,url.length-3);
  var resource = require(path.join(route,name,'index.js'));


  var obj = {
    key: resource.key,
    model: resource.model,
    controller: resource.controller,
  }
  if (resource.expects) obj.expects = resource.expects;

  return 'defapi(\''
    +name
    +'\','
    +JSON.stringify(obj)
    +');'
  ;
}

