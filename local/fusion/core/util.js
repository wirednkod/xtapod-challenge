
var validateSchema = require('json-schema').validate;
var Fiber = require('fibers');
var mail = require('../mail');
var clone = require('../clone');
var S = require('string');

exports.checkGlobals = function(globalSizeLimit) {
  // Check for leaky globals
  var globalSize = 0;
  for (var k in global) globalSize++;
  if (globalSize > globalSizeLimit) {
    for (var k in global)
      console.log(k);
    throw new Error('Global size has increased to '+globalSize+' and it should be '+globalSizeLimit+'!');
  }
}

exports.parseQuery = function(obj,query) {
  for (var k in query) {
    if (isNaN(query[k]) || (typeof query[k] != 'string'))
      obj[k] = query[k]
    else obj[k] = +query[k];
  }
}

var cleanAlphanumeric = cleanRegex(/^[a-z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžæð∂Þªß\-\_\+\s]+$/i);
var cleanName = cleanRegex(/^[a-z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžæð∂Þªß\,\'\_\!\+\-\.\?\(\)\@\s]+$/i);
var cleanDefault      = cleanRegex(/^[a-z0-9àáâäãåąčćęèéêëėįìíîïłńòóôöõøùúûüųūÿýżźñçčšžæð∂Þªß\,\'\_\!\%\+\-\.\!\:\|\?\(\)\@\\\/\s]+$/i);

function cleanRegex(regex) {
  return function(str) {
    if (!str) return '';
    if (!regex.test(str)) {
      var res = '';
      for (var k in str) {
        if (regex.test(str[k])) res += str[k]
        else res += '?';
      }
      return res;
    } else return str;
  }
}

function extractArgs(dest,src,schema) {
  var prop = schema.properties;
  for (var k in src) {
    if (k in prop) {
      switch(prop[k].type) {
        case 'integer':
          dest[k] = +src[k];
        break;
        case 'number':
          dest[k] = +src[k];
        break;
        case 'boolean':
          dest[k] = src[k] == 'true' || src[k] == '1';
        break;
        case 'string':
          if (prop[k].format) {
            switch(prop[k].format) {
              case 'text':
                dest[k] = src[k]?S(src[k]).escapeHTML().s:'';
              break;
              case 'clean':
                dest[k] = src[k]?S(src[k]).stripTags().s:'';
              break;
              case 'name':
                dest[k] = cleanName(src[k]);
              break;
              case 'alpha':
                dest[k] = cleanAlphanumeric(src[k]);
              break;
              case 'unsafe':
                dest[k] = src[k]?src[k]:'';
              break;
              default:
                dest[k] = cleanDefault(src[k]);
            }
          } else dest[k] = cleanDefault(src[k]);
        break;
        case 'array':
          dest[k] = [];
          var v = src[k];
          for (var j in v) {
            var d = {}, s = {};
            s.item = v[j];
            extractArgs(d,s,{properties:{item:prop[k].items}});
            dest[k].push(d.item);
          }
        break;
        case 'object':
          if (prop[k].properties) {
            dest[k] = {};
            extractArgs(dest[k],src[k],prop[k])
          } else dest[k] = src[k];
        break;
      }
    }
  }
}

exports.validate = function($P,args,expects) {
  $P.args = {};

  // Clone the expects object so that the original is not modified
  expects = expects || {};
  expects = clone(expects);

  // Make sure all scripts can handle the global m and g parameters
  expects.m = {type:'integer'};
  expects.g = {type:'integer'};

  // Change any "document" property types to "object" for validation
  for (var k in expects) {
    if (expects[k].type == 'document')
      expects[k].type = 'object';
  }

  // Create the schema for validation
  var schema = {properties:expects};

  extractArgs($P.args,args,schema);

  var validation = validateSchema($P.args,schema);
  if (!validation.valid) {
    var msg = '';
    var errors = validation.errors;
    for (var k in errors) {
      msg += 'Field \''+errors[k].property+'\' '+errors[k].message+' ';
    }

    // Display an error message to the user
    if ($P.verb == 'get')
      $P.error(new Error('Oops, this looks like an invalid url. If you clicked on a link, make sure the link wasn\'t split across multiple lines.'));
    else throw new Error(msg);
  }
}

exports.modifyExpects = function(script,args) {
  var expects = script.expects;
  var allowFor = script.allowFor;
  for (var k in allowFor) {
    if (k != 'omit') {
      if (args[k] == allowFor[k]) {
        var omit = allowFor.omit;
        for (var j in omit) {
          expects[omit[j]].required = false;
        }
      }
    }
  }

  return expects;
}

var totalFibers = 0;

exports.checkFibers = function(script,args) {
  console.log('FIBERS CREATED='+Fiber.fibersCreated);
  if (Fiber.fibersCreated > totalFibers) {
    totalFibers = Fiber.fibersCreated;

    if (Const.maxFibers && totalFibers > Const.maxFibers) {
      process.exit();
    } else if (totalFibers == 20) {
      mail.warn('Fibers Created > 20','The current number of fibers is <b>'+totalFibers+'</b> for '+Const.server+'. You should probably take a look.');
    } else if (totalFibers % 50 == 0) {
      mail.warn('Fiber Overload','Help! The server is getting overloaded. The current number of fibers is <b>'+totalFibers+'</b> for '+Const.server+'. You should fix this immediately.');
    } else if (totalFibers > 150) {
      mail.warn('Fiber Overload','Help! The server is in a panic! Fix this immediately or it will crash. The current number of fibers is <b>'+totalFibers+'</b> for '+Const.server+'!');
    }
  }
}

