
var globals = require('./globals');

function PageModel(src) {
  this._src = src;
}

function escape(val) {
  if (val.search('"') == -1)
    return '"'+val+'"'
  else if (val.search("'") == -1)
    return "'"+val+"'"
  else return '"'+val.replace(/\"/g,'\\"')+'"';
}

PageModel.prototype.img = function(attributes) {
  var attr = [];

  // Handle images that are on s3
  if (Const.bundled) {
    if ('src' in attributes && globals.assets[attributes.src])
      attributes.src = Const.amazonSrc+'/assets/'+globals.assets[attributes.src];
    if ('data-at2x' in attributes && globals.assets[attributes['data-at2x']])
      attributes['data-at2x'] = Const.amazonSrc+'/assets/'+globals.assets[attributes['data-at2x']];
  }

  for (var k in attributes) {
    if (k == 'terse') continue;
    attr.push(k+'='+escape(attributes[k]));
  }
  return '<img '+attr.join(' ')+'>';
}

PageModel.prototype.src = function(attributes) {
  if ('scripts' in attributes) {
    if (this._src.list) this._src.list.scripts.push(attributes.scripts);
    return this._src.scripts[attributes.scripts]
  }
  if ('styles' in attributes) {
    if (this._src.list) this._src.list.styles.push(attributes.styles);
    return this._src.styles[attributes.styles];
  }
}


module.exports = PageModel;

