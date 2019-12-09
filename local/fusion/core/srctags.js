
var globals = require('./globals');
var path = require('path');

exports.makeScriptTags = function(src) {
  var html = {content:''};

  if (Const.bundled) {
    html.content += '<script type="text/javascript" src="'+srcPath(Const.amazonSrc+'/'+Const.includes[src.name])+'.js" crossorigin></script>'
  } else {
    if (src.isRouterSrc) {
      // Ex: js[k] = www
      include(html,src,'jade','<script type="text/javascript" src="','"></script>');

      // Ex: globals.routers.www.resources
      var router = globals.routers[src.name];
      if (router && router.resources)
        includeModelDefs(html,router.resources);

      // Ex: js[k] = www
      include(html,src,'js','<script type="text/javascript" src="','"></script>');
    } else
      include(html,src,'js','<script type="text/javascript" src="','"></script>');
  }

  return html.content;
}

exports.makeStyleTags = function(src) {
  var html = {content:''};

  if (Const.bundled) {
    // Loop through and add all bundles
    html.content += '<link rel="stylesheet" href="'+srcPath(Const.amazonSrc+'/'+Const.includes[src.name])+'.css">';
  } else {
    // Loop through and add all non src css files
    if (src.css.length)
      include(html,src,'css','<link rel="stylesheet" href="','">');

    if (src.less.length) {
      html.content += '<link rel="stylesheet" href="/style/'+src.name+'.css">';
    }
  }

  return html.content;
}

function srcPath(path) {
  if (Const.relativeTo) {
    return path.indexOf(Const.relativeTo) == 0 ? path.slice(Const.relativeTo.length) : path;
  } else return path;
}

function includeModelDefs(html,resources) {
  for (var k in resources)
    html.content += '<script type="text/javascript" src="'+resources[k]+'.js"></script>';
}

function include(html,src,type,pre,post) {
  var list = src[type];
  if (list) {
    for (var k in list) {
      if (list[k].name)
        html.content += pre+list[k].name+post
      else if (list[k].include == 'fusion')
        html.content += '<script type="text/javascript" src="/fusion/fusion.js"></script>'
      else {
        console.log(path.dirname(src.filenames.script));
        console.log(list[k].include);
        process.exit();
        include(html,list[k].include,type,pre,post);
      }
    }
  }
}

