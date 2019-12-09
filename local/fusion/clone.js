
/**
 * This module was created due to the lack of support for deep cloning in
 * javascript in general. For shallow cloning use node.js's util._clone method.
 * The problem with deep cloning in javascript arises when you want to clone
 * derived objects as opposed to primitive objects. However, for most use cases
 * when you need to clone an object, it's usually a primitive object anyway.
 * This module provides the simplest method for cloning an object that contains
 * only primitives, arrays, or primitive objects. Any derived objects will
 * throw an exception.
 *
 */


function cloneArray(array) {
  var newArray = [];
  for (var k in array) {
    if (array[k] === null) newArray.push(null)
    else if (typeof array[k] == 'object') {
      if (Object.getPrototypeOf(array[k]) === Object.prototype)
        newArray.push(cloneObj(array[k]))
      else if (Object.getPrototypeOf(array[k]) === Array.prototype)
        newArray.push(cloneArray(array[k]))
      else throw new Error('For cloning, objects should contain only primitives, arrays, and primitive objects.');
    } else newArray.push(array[k]);
  }
  return newArray;
}

function cloneObj(obj) {
  var newObj = {};
  for (var k in obj) {
    if (obj[k] === null)
      newObj[k] = null;
    else if (typeof obj[k] == 'object') {
      if (Object.getPrototypeOf(obj[k]) === Object.prototype)
        newObj[k] = cloneObj(obj[k])
      else if (Object.getPrototypeOf(obj[k]) === Array.prototype)
        newObj[k] = cloneArray(obj[k])
      else throw new Error('For cloning, objects should contain only primitives, arrays, and primitive objects.');
    } else newObj[k] = obj[k];
  }
  return newObj;
}

module.exports = function(obj) {
  if (typeof obj == 'object') {
    if (Object.getPrototypeOf(obj) === Object.prototype)
      return cloneObj(obj)
    else if (Object.getPrototypeOf(obj) === Array.prototype)
      return cloneArray(obj)
    else throw new Error('For cloning, objects should contain only primitives, arrays, and primitive objects.');
  } else return obj;
}

