
var csv = require('csv');
var Fiber = require('fibers');
var fs = require('fs');

// The callback here behaves synchronously b/c of fibers
exports.forEach = function(filename,options,op) {
  // Parse options
  var offset = options.offset || 0;

  // Lowercase "fiber" will now reference the currently running fiber
  var fiber = Fiber.current;

  var E = null;

  csv()
  .from.stream(fs.createReadStream(filename))
  .on('record', function(row,index){
    // If offset > 0 then skip rows until it is
    if (offset == 0) {
      op(row);
    } else offset--;
  })
  .on('end', function(count){
    fiber.resume();
  })
  .on('error', function(error){
    E = error;
    console.log(error.message);
    fiber.resume();
  });

  Fiber.yield();

  if (E) throw new Error(E)
  else return;
}

exports.csv2json = function(filename,options) {
  // Parse options
  options = options || {};
  var offset = options.offset || 0;
  var fields = options.fields || null;

  // Lowercase "fiber" will now reference the currently running fiber
  var fiber = Fiber.current;

  var rows = [];
  var E = null;

  csv()
  .from.stream(fs.createReadStream(filename))
  .on('record', function(row,index){
    // If offset > 0 then skip rows until it is
    if (offset == 0) {
      // If options.fields is defined, use field names
      if (fields) {
        var obj = {};
        for (var k in row) {
          obj[fields[k]] = row[k];
        }
        rows.push(obj);
      } else rows.push(row);
    } else offset--;
  })
  .on('end', function(count){
    fiber.resume();
  })
  .on('error', function(error){
    E = error;
    console.log(error.message);
    fiber.resume();
  });

  Fiber.yield();

  if (E) throw new Error(E)
  else return rows;
}

