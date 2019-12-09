
var css = require('css');
var fs = require('fusion/fs');
var path = require('path');
var globals = require('../globals');
var urlParser = require('url');

function filterRules(rules,urls,rewriteURL) {
  var hasURL = /url\(\s*\"*\'*(.+?)\"*\'*\s*\)/g;
  for (var k in rules) {
    if (rules[k].rules) filterRules(rules[k].rules,urls,rewriteURL);
    var decs = rules[k].declarations;
    for (var j in decs) {
      if (hasURL.test(decs[j].value)) {
        decs[j].value = decs[j].value.replace(hasURL,function(match, contents) {
          var url = rewriteURL(contents);
          urls.push(url);
          return 'url('+url+')';
        });
      }
    }
  }
}

function filterCSSURLs(obj,urls,rewriteURL) {
  var rules = obj.stylesheet.rules;
  filterRules(obj.stylesheet.rules,urls,rewriteURL)
}

function rewriteURL(url) {
  // Parse the url
  var parts = urlParser.parse(url);

  // If this is already a http-based url, skip it altogether
  if (parts.host) return url;

  // Remove any argument strings from the url
  url = parts.pathname;

  // Rewrite the url
  if (Const.bundled) {
    if (url in globals.assets) {
      return Const.amazonSrc+'/assets/'+globals.assets[url]
    } else return url;
  } else {
    return url;
  }
}

exports.parseLessURLs = function(src,urls) {
  urls = urls || [];
  var tree = css.parse(src);
  filterCSSURLs(tree,urls,rewriteURL);
  return css.stringify(tree);
}

exports.build = function(includes,urls) {
  urls = urls || [];
  var cssSrc = '';
  for (var k in includes) {
    var absDir = path.dirname(includes[k].path);
    var relDir = path.dirname(includes[k].name);
    var file = fs.readFile(includes[k].path,'utf-8');

    var tree = css.parse(file);
    filterCSSURLs(tree,urls,function(url) {
      return rewriteURL(path.resolve(relDir,url));
    });
    cssSrc += css.stringify(tree)+'\n';
  }
  return cssSrc;
}

exports.cat = function(includes) {
  var cssSrc = '';
  for (var k in includes) {
    var dir = path.dirname(includes[k].name);
    var file = fs.readFile(includes[k].path,'utf-8');

    cssSrc += file+'\n';
  }
  return cssSrc;
}

