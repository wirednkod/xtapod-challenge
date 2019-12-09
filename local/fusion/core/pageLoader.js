
var Roles = require('./Roles');

var PageLoader = function() {
  // Default title that shows up on a page when none is specified
  this.defaultTitle = '';

  // Roles defines permissions for various server requests
  this.Roles = Roles;

  // Abstract handler for broadcasting synchronization messages across
  // multiple client instances
  this.sync = function() {};

  // Variables on $P that need to persist as session data
  this.persistVars = {};

  // Templates onto which all pages will be rendered
  this.templates = {
  };

  // This helps check for leaky globals
  this.globalSizeLimit = null;
}

PageLoader.prototype.configurePage = function($P) {
  return {}
}

PageLoader.prototype.handlePageError = function($P,e) {
  // Print the message to the console
  console.error('ERROR: '+e.message);
  console.error(e.stack);
  if (e.details) console.error(e.details);
}


PageLoader.prototype.preSession = function($P) {
}

PageLoader.prototype.loadSession = function($P) {
}

PageLoader.prototype.setupEnv = function($P) {
}

PageLoader.prototype.checkLogin = function($P,script) {
  return true;
}

module.exports = new PageLoader();

