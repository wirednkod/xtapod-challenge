
var CorePageModel = require('fusion/core/PageModel');
var extend = require('fusion/extend');

function PageModel($P,src) {
  this._$P = $P;
  this._src = src;

  var config = {
    name:$P.name,
    live: Const.live,
    title:$P.title,
    scripts:$P.scripts,
    styles: $P.styles,
    bundled: Const.bundled,
  }
  for (var k in config) this[k] = config[k];
}
extend(PageModel,CorePageModel);

var jsMap = {
  '/includes/3rd.js.list': '<script type="text/javascript" src="3rd.min.js"></script>',
  '/includes/boot.js.list': '<script type="text/javascript" src="boot.min.js"></script>',
  '/client/scripts': '',
}
var cssMap = {
  '/includes/local.css.list': '<link rel="stylesheet" href="css/local.less.css">',
  '/client/scripts': '',
}

PageModel.prototype.src = function(attributes) {
  if ('scripts' in attributes) {
    if (this._src.list) this._src.list.scripts.push(attributes.scripts);
    if (Const.bundled) return jsMap[attributes.scripts]
    else return this._src.scripts[attributes.scripts]
  }
  if ('styles' in attributes) {
    if (this._src.list) this._src.list.styles.push(attributes.styles);
    if (Const.bundled) return cssMap[attributes.styles]
    else return this._src.styles[attributes.styles];
  }
}

module.exports = PageModel;

