
var globals = require('./globals');
var jade = require('jade');
var src = require('./src');
var PageModel = require('./PageModel');

function WebTemplate(config,jadeFile) {

  // Determine the includes for the jade template
  var includes = extractIncludes(jadeFile);

  // Keep a reference on this object to the global tag list
  this.src = {scripts: {}, styles: {}};

  // Process included source files (if any)
  if (includes.length) {
    // Compile the includes (+src tags) as a single jade file
    var incJade = jade.compile(globals.pageMixins+includes.join('\n'),{pretty:Const.debugging});

    // Attach the special mixins (img and src) to the args object
    //var args = {};
    var tempSrc = {scripts: {}, styles: {}, list: {scripts: [], styles: []}};
    var pageModel = new PageModel(tempSrc);

    // Run jade template once to extract source includes
    incJade(pageModel);

    // The resulting "tempSrc.list" object will contain a list of source bundles for this template.
    // Use this list to load the relevant source bundles
    this.loadSrc(config,tempSrc.list);
  }

  // Compile full jade template
  this.jade = jade.compile(globals.pageMixins+jadeFile,{pretty:Const.debugging});

//  var assets = globals.assets;
}

function extractIncludes(jadeFile) {
  var srcLines = [];
  var lines = jadeFile.split('\n');
  for (var k in lines) {
    var line = lines[k].trim();
    if (line.indexOf('+src') == 0)
      srcLines.push(line);
  }
  return srcLines;
}

WebTemplate.prototype.loadSrc = function(config,list) {
  for (var k in list.scripts) {
    var source = src.get(config,'script',list.scripts[k]);
    this.src.scripts[source.filenames.script] = source.scriptTags;
  }

  for (var k in list.styles) {
    var source = src.get(config,'style',list.styles[k]);
    this.src.styles[source.filenames.style] = source.styleTags;
  }
}

module.exports = WebTemplate;

