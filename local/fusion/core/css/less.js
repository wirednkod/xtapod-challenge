
var less = require('../less');
var wrap = require('../wrap');

exports.build = function(includes) {
  // Load all imports and src less files
  var paths = [];
  var lessSrc = '';
  var imports = [];
  for (var k in includes) {
    if (includes[k].wrap)
      lessSrc += wrap.less(includes[k].name.slice(includes[k].name.split('/')[1].length+2),includes[k].path);
    else
      imports.push('@import "'+includes[k].name.slice(1)+'";');
  }

  // Compile the generated less file
  return less.compile(imports.join('\n')+lessSrc,{
    rootpath: '/',
    relativeUrls: true,
    paths: [rootDir+'client/'],
  });
}
