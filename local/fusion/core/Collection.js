
// Define fusion mappings by underscore function
var Collection = function(init) { this.list = init || []; };

Collection.prototype = {

  /* Underscore Collection functions */
  each: function(iterator,context) {
    return _.each(this.list,iterator,context);
  },
  map: function(iterator,context) {
    return _.map(this.list,iterator,context);
  },
  reduce: function(iterator,memo,context) {
    return _.reduce(this.list,iterator,memo,context);
  },
  reduceRight: function(iterator,memo,context) {
    return _.reduceRight(this.list,iterator,memo,context);
  },
  find: function(predicate,context) {
    return _.find(this.list,predicate,context);
  },
  filter: function(predicate,context) {
    return _.filter(this.list,predicate,context);
  },
  where: function(properties) {
    return _.where(this.list,properties);
  },
  findWhere: function(properties) {
    return _.where(this.list,properties);
  },
  findWhere: function(properties) {
    return _.findWhere(this.list,properties);
  },
  reject: function(predicate,context) {
    return _.reject(this.list,predicate,context);
  },
  every: function(predicate,context) {
    return _.every(this.list,predicate,context);
  },
  some: function(predicate,context) {
    return _.some(this.list,predicate,context);
  },
  contains: function(value) {
    return _.contains(this.list,value);
  },
  invoke: function(methodName) {
    var args = [this.list,methodName];
    for (var k=1;k<arguments.length;k++) args.push(arguments[k]);
    _.invoke.apply(this,args);
  },
  pluck: function(propertyName) {
    return _.pluck(this.list,propertyName);
  },
  max: function(iterator,context) {
    return _.max(this.list,iterator,context);
  },
  min: function(iterator,context) {
    return _.min(this.list,iterator,context);
  },
  sortBy: function(iterator,context) {
    return _.sortBy(this.list,iterator,context);
  },
  groupBy: function(iterator,context) {
    return _.groupBy(this.list,iterator,context);
  },
  indexBy: function(iterator,context) {
    return _.groupBy(this.list,iterator,context);
  },
  countBy: function(iterator,context) {
    return _.countBy(this.list,iterator,context);
  },
  shuffle: function() {
    return _.shuffle(this.list,iterator,context);
  },
  sample: function(n) {
    return _.shuffle(this.list,n);
  },
  toArray: function() {
    return _.toArray(this.list);
  },
  size: function() {
    return _.size(this.list);
  },

  /* Underscore Array functions */
  first: function(n) {
    return _.first(this.list,n);
  },
  initial: function(n) {
    return _.initial(this.list,n);
  },
  last: function(n) {
    return _.last(this.list,n);
  },
  rest: function(index) {
    return _.rest(this.list,n);
  },
  compact: function() {
    return _.compact(this.list,n);
  },
  flatten: function() {
    return _.compact(this.list,n);
  },
  without: function() {
    return _.without.apply(this.list,arguments);
  },
  partition: function(predicate) {
    return _.partition(this.list,predicate);
  },
  union: function() {
    this.list = _.union.apply(_,arguments);
  },
  intersection: function() {
    this.list = _.intersection.apply(_,arguments);
  },
  difference: function() {
    var args = [this.list];
    for (var k in arguments) args.push(arguments[k]);
    return _.difference.apply(_,args);
  },
  uniq: function(isSorted,iterator) {
    return _.uniq(this.list,isSorted,iterator);
  },
  zip: function() {
    return _.zip.apply(_,arguments);
  },
  object: function() {
    var args = [this.list];
    for (var k in arguments) args.push(arguments[k]);
    return _.object.apply(_,args);
  },
  indexOf: function(value,isSorted) {
    return _.indexOf(this.list,value,isSorted);
  },
  lastIndexOf: function(value,fromIndex) {
    return _.lastIndexOf(this.list,value,fromIndex);
  },
  sortedIndex: function(value,iterator,context) {
    return _.sortedIndex(this.list,value,iterator,context);
  },
  range: function(start,stop,step) {
    this.list = _.range(this.list,start,stop,step);
    return this.list;
  },
}

module.exports = Collection;

