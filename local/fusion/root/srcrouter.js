
var fs = require('../fs');
var path = require('../path');
var static = require('node-static');
var globals = require('../core/globals');
var wrap = require('../core/wrap');

exports.static = true;

module.exports = function(dir,includes) {
  return function($P) {
    route($P,dir,includes);
  }
}

function error404($P) {
  $P.res.status(404);
  return $P.render($P.views.notFound404);
}

function route($P,dir,includes) {
  var ss = new static.Server(path.join(rootDir,dir+'/'));
  var url = $P.req.params[0];

  $P.assert(url && path.isSafe(url),new Error('Invalid request data. Please try again or report this as a bug.'));

  var urlFilename = $P.req.url.slice(1);

  // Determine if this is a js file or a jade file
  var isJS = path.extname(path.basename(url,path.extname(url))) != '.jade';

  // Check filename against the includes list
  if (includes) {
    var dirParts = urlFilename.split('/').slice(1);
    if (includes.indexOf(dirParts[0]) == -1) return error404($P);
    urlFilename = dirParts.join('/');
    var handler = 'isojs';
  } else var handler = isJS ? 'js' : 'jade';

  // Determine the filename of the source file
  if (isJS) var filename = path.join(rootDir,dir,urlFilename)
  else var filename = path.join(rootDir,dir,path.dirname(urlFilename)+'/'+path.basename(urlFilename,'.js'));

  if (Const.cacheAfter) {
    var stat = fs.stat(filename);
    if (+new Date(stat.mtime) < + new Date() - Const.cacheAfter)
      $P.res.setHeader('Cache-Control', 'public, max-age=86400');
  }
  $P.res.setHeader('Content-Type','text/javascript');
  $P.res.send(wrap[handler](url,filename));
}

