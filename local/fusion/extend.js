
module.exports = (function() {
  // proxy used to establish prototype chain
  var F = function() {};
  // extend Child from Parent
  return function(Child, Parent) {
    F.prototype = Parent.prototype;
    Child.prototype = new F();
    Child.__super__ = Parent.prototype;
    Child.prototype.constructor = Child;
  };
}());

