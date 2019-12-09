
var fs = require('fs');
var path = require('path');
var srctags = require('./srctags');

var srcLibrary = {};

function WebSource(name) {
  // Name that identifies the source bundle
  this.name = name;

  // The filenames that have been loaded for scripts and styles
  this.filenames = {script: '', style: ''};

  // Where the source lists will live
  this.js = [];
  this.jade = [];
  this.less = [];
  this.css = [];
}

WebSource.prototype.load = function(config,type,name,filename) {
  // Full path of the source list or directory
  var srcPath = path.join(rootDir,filename);

  if (fs.existsSync(srcPath)) {
    var stat = fs.statSync(srcPath);

    // If this is a directory, we do special processing on all the files
    if (stat.isDirectory()) {
      this.isRouterSrc = true;

      addWebRouterSrc(config,this,name,srcPath);

      this.filenames = {script: filename, style: filename};
      this.scriptTags = srctags.makeScriptTags(this);
      this.styleTags = srctags.makeStyleTags(this);
    // ... otherwise this is a source list
    } else {
      addSrcList(config,this,srcPath);
      this.filenames[type] = filename;

      // Add html tags
      if (type == 'script')
        this.scriptTags = srctags.makeScriptTags(this);
      if (type == 'style')
        this.styleTags = srctags.makeStyleTags(this);
    }
  } else throw new Error('Could not find '+srcPath);
}

function getName(filename) {
  var parts = filename.split('/');
  var last = parts[parts.length-1].split('.');
  return last[0];
}

exports.get = function(config,type,filename) {
  // Reduce the filename to a web source name
  var name = getName(filename);

  // Get the source if it already exists
  var source = srcLibrary[name];

  // If the source does not exist, create it
  if (!source) {
    source = new WebSource(name);
    source.load(config,type,name,filename);
    srcLibrary[name] = source;
  } else {
    if (!source.filenames[type]) source.load(config,type,name,filename)
    else if (source.filenames[type] != filename) throw new Error('"'+name+'" identifier for included '+type+' '+filename+' is already taken by '+source.filenames[type]);
  }

  return source;
}

function addGlobalStyles(src,filename) {
  var lines = fs.readFileSync(filename,'utf8').split('\n');
  for (var k in lines) {
    if (lines[k]) {
      var ext = path.extname(lines[k]).slice(1);
      src[ext].push({
        name: lines[k],
        path: path.join(rootDir,'client',lines[k])
      });
    }
  }
}

function addWebRouterSrc(config,src,name,filename) {

  // Determine if any global styles exist
  if (fs.existsSync(path.join(filename,'style')))
    addGlobalStyles(src,path.join(filename,'style'));

  // Loop through all directories and add scripts
  addSrcDir(src,name,filename);

  // Loop through shared directory and add any shared scripts
  if (fs.existsSync(path.join(rootDir,'client','shared')))
    addSrcDir(src,'shared',path.join(rootDir,'client','shared'));

  // Add server-side modules includes
  for (var k in config.sharedModules)
    addIsomorphicModuleDir(src,config.sharedModules[k],path.join(rootDir,config.projectNodeModules,config.sharedModules[k]));
}

function addSrcDir(src,name,base,dir) {
  dir = dir || '';

  var files = fs.readdirSync(base+dir);
  for (var k in files) {
    var stat = fs.statSync(base+dir+'/'+files[k]);
    var ext = path.extname(files[k]);

    if (stat.isDirectory())
      addSrcDir(src,name,base,dir+'/'+files[k])
    else if (ext == '.js')
      src.js.push({
        name: path.join('/'+name,dir,files[k]),
        path: path.join(base,dir,files[k])
      })
    else if (ext == '.jade')
      src.jade.push({
        name: path.join('/'+name,dir,files[k])+'.js',
        path: path.join(base,dir,files[k])
      })
    else if (ext == '.less')
      src.less.push({
        name: path.join('/'+name,dir,files[k]),
        path: path.join(base,dir,files[k]),
        wrap: true,
      });
  }
}

function parseListFile(filename,files) {
  // Read the .list file and assign the sources to the proper bundle
  var list = fs.readFileSync(filename,'utf8').split('\n');
  for (var j in list) {
    if (list[j]) {
      if (list[j][0] != '@')
        files.push({
          name: list[j],
          path: path.join(rootDir,'client',list[j]),
        })
      else {
        var include = list[j];
        if (include.search('@import ') == 0)
          parseListFile(path.join(path.dirname(filename),include.slice(8)),files)
        else if (include.search('@fusion') == 0)
          files.push({include: 'fusion'})
        else throw new Error('Invalid directive '+include+' in '+filename+'.');
      }
    }
  }
}

function addSrcList(config,src,filename) {
  var basename = path.basename(filename);
  // Check to make sure the .list files are named correctly
  var parts = basename.split('.');
  if (!(parts.length == 3 && ((parts[1] == 'js') || (parts[1] == 'css') || (parts[1] == 'less'))))
    throw new Error('Invalid .list file name in includes: '+basename);

  // Determine the script type
  var files = src[parts[1]];
  if (!files) {
    files = [];
    src[parts[1]] = files;
  }

  // Parse the .list file
  parseListFile(filename,files);
}

function addIsomorphicModuleDir(src,name,base,dir) {
  dir = dir || '';

  var files = fs.readdirSync(base+dir);
  for (var k in files) {
    var stat = fs.statSync(base+dir+'/'+files[k]);
    var ext = path.extname(files[k]);

    if (stat.isDirectory())
      addIsomorphicModuleDir(src,name,base,dir+'/'+files[k])
    else if (ext == '.js')
      src.js.push({
        name: path.join('/modules/'+name,dir,files[k]),
        path: path.join(base,dir,files[k]),
        isomorphic: true,
      })
  }
}

exports.lib = srcLibrary;

