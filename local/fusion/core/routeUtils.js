
var globals = require('./globals');
var util = require('./util');

exports.executeRoute = function($P,script) {
  try {

    var request = globals.requestHandler;

    // Set up the basic page object
    $P.title = script.title || globals.defaultTitle;

    request.preSession($P);

    // Combine and parse all args
    var args = {};

    util.parseQuery(args,$P.req.query);
    util.parseQuery(args,$P.req.body);

    // Load a previously declared session
    if (!request.loadSession($P,script)) return;

    // System integrity checks
    util.checkGlobals(globals.globalSizeLimit);
    util.checkFibers();

    // Check for conditional expects
    var expects = script.expects;
    if (script.allowFor) expects = util.modifyExpects(script,args);

    // Do some custom logic
    if (!request.checkLogin($P,script)) return;

    // Validate the incoming args against the "expects" schema
    //  and load validated args into $P.args
    util.validate($P,args,expects);

    // NOTE: The way the environment is being set up right now is not efficient
    //   We should simply store the GroupID and MID in the session rather than
    //   recheck every single time to see if the user is a member
    request.setupEnv($P);

    // Check privileges for the current request
    if (script.requires)
      script.requires($P);

    // Execute any necessary logic and render the page
    script.main($P);
  } catch(e) {
    request.handlePageError($P,e,args);
  }
}

