
var fs = require('../fs');
var path = require('../path');
var static = require('node-static');
var wrap = require('../core/wrap');
var less = require('../core/css/less');
var lessCompiler = require('../core/less');
var css = require('../core/css/css');
var src = require('../core/src');
exports.static = true;

exports.route = function($P) {
  var ss = new static.Server(rootDir+'client/');
  var url = $P.req.params[0];

  $P.assert(url && path.isSafe(url),new Error('Invalid request data. Please try again or report this as a bug.'));

  var filename = url;
  $P.res.setHeader('Content-Type','text/css');
  if (Const.cacheStyles) $P.res.setHeader('Cache-Control', 'public, max-age=86400');

  if (path.extname(url) == '.css') {

    var bundleName = path.basename(url,'.css');

    var bundle = src.lib[bundleName];
    if ('less' in bundle) {
      var lessBuild = less.build(bundle.less);
      var res = Const.bundled ? css.parseLessURLs(lessBuild) : lessBuild;
      $P.res.send(res);
    } else if ('css' in bundle) {

      var res = Const.bundled ? css.build(bundle.css) : css.cat(bundle.css);
      $P.res.send(res);
    }
  } else {
    var lessFile = fs.readFile(path.join(rootDir,'client/css',filename),'utf8');
    $P.res.send(lessCompiler.compile(lessFile));
  }
}

