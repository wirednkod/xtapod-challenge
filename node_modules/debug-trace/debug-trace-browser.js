/**
 * Store custom options
 *
 * @param {Object} options
 * @api public
 */

module.exports = function debugTrace(options) {
  options = options || {};
  console.traceOptions = console.traceOptions || {};
  console.traceOptions.always = typeof options.always !== 'undefined' ? options.always : true;
}

// only works with Chrome (V8)
if (typeof Error.captureStackTrace === 'function') {

  var callsite = require('callsite');

  /**
   * Overrides the console methods.
   */

  ;['error', 'log', 'info', 'warn', 'trace'].forEach(function (name) {
    var fn = console[name];
    console[name] = function () {
      var args = arguments;
      if (console._trace || console.traceOptions.always) {
        if (args.length === 1) args = ['', args[0]];
        if (typeof args[0] === 'object') {
          args[0] = JSON.stringify(args[0], null, '  ');
        }
        // when using the debug module: dig one level deeper in the stack
        var stack = callsite();
        var trace = stack[1];
        if (stack.length > 2 && trace.getFunctionName() === 'log') {
          trace = stack[3];
          trace.debug = true;
        }
        trace.debug = trace.debug || false;
        args[0] = console.traceFormat(trace, name) + args[0];
      }
      console._trace = false;
      return fn.apply(this, args);
    }
  });

  /**
   * Overridable formatting function.
   *
   * @param {CallSite}
   * @param {String} calling method
   * @api public
   */

  console.traceFormat = function (call, method) {
    var options = {};
    call.method = method;
    call.functionName = call.getFunctionName() || 'anonymous';
    call.getDate = function getDate() {
      return new Date().toISOString().replace('T', ' ').replace('Z', '');
    }
    return console.format(call);
  }


  /**
   * Overridable string formatting function.
   *
   * @param {CallSite} CallSite Object pimped with additional properties.
   * @api public
   */
  console.format = function (c) {
    return "[" + c.getFileName() + ":" + c.getLineNumber() + "] " + c.functionName + " ";
  };

  /**
   * Adds trace getter to the `console` object.
   *
   * @api public
   */

  function getter() {
    this._trace = true;
    return this;
  }

  Object.defineProperty(console, 't', { get: getter });
  Object.defineProperty(console, 'traced', { get: getter });

}
