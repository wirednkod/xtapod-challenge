
exports.handlePageError = function($P,e,args) {
  // Print the message to the console
  console.error('ERROR: '+e.message);
  console.error(e.stack);
  if (e.details) console.error(e.details);

  // Determine the message the user will see
  if (e.tellUser) {
    var errorObj = {error:{msg:e.message}};
  } else {
    var errorObj = {error:{msg:'Internal server error. It would be greatly appreciated if you report this as a bug to support@osmosis.org.',type:'Internal'}};
    e.httpStatus = 500;
  }

  if (e.httpStatus)
    $P.res.status(e.httpStatus).send(errorObj)
  else $P.res.send(errorObj,400);
}

exports.preSession = function($P) {
  // Set access control
  $P.res.header('Access-Control-Allow-Origin','*');
}

function getServer(subdomain,server) {
  if (server.indexOf('localhost') == -1) {
    var url = _url.parse(server);
    return url.protocol+'//'+(subdomain ? subdomain+'.'+url.hostname.split('.').slice(1).join('.') : url.hostname)+'/';
  } else return server;
}

exports.loadSession = function($P) {
  // If we've made it this far, all is good and we can load the page
  return true;
}

exports.setupEnv = function($P) {
}

exports.checkLogin = function($P,script) {
  return true;
}

exports.loadWebSocketSession = function($W,store) {
}

