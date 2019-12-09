
var fs = {};

(function( fs ) {

var lib = {};
var libtmp = {};
var libapi = {};
var libindex = {};

fs.define = function(path,loader) {
  var names = path.split('.');
  var group = lib;
  for (var k=0;k<names.length-1;k++) {
    if (!(names[k] in group)) {
      group[names[k]] = {};
      group[names[k]].group = {};
      group = group[names[k]].group;
    } else group = group[names[k]].group;
  }

  var def = {
    path:path,
    loader:loader,
    mod:null,
  };

  group[names[names.length-1]] = def;
  return def;
}

fs.deftmp = function(path,template) {
  var names = path.split('.');
  var group = libtmp;
  for (var k=0;k<names.length-1;k++) {
    if (!(names[k] in group)) {
      group[names[k]] = {};
      group[names[k]].group = {};
      group = group[names[k]].group;
    } else group = group[names[k]].group;
  }

  var def = {
    path:path,
    template:template.template,
  };

  group[names[names.length-1]] = def;
  return def;
}

fs.defapi = function(path,resource) {
  // Get the model key
  var keyName = '';
  var keyType = '';
  for (var k in resource.key) {
    keyName = k;
    keyType = resource.key[k];
  }
  if (!keyName) throw new Error('Model does not have a key!');

  // Create the resource definition
  libapi[path] = {
    route: path,
    key: keyName,
    keyType: keyType,
    model: resource.model,
    expects: resource.expects,
    controller: resource.controller,
    editing: null,
  };

  // Create the empty index for the resource
  libindex[path] = {};
}

function loadModule(obj) {
  if (!obj.mod) {
    obj.mod = {};
    obj.mod.exports = {};
    obj.loader(obj.mod.exports,require,obj.mod);
  }
}

fs.require = function(name) {
  // Search for the module
  var path = name.split('/');
  var obj = lib;
  for (var k in path) {
    var next = obj[path[k]];
    if (next) {
      if (k<path.length-1) obj = next.group
      else obj = next;
    } else { throw Error('Failed to find module '+name); }
  }

  // Check to see if this is an index route
  if (obj.group && 'index' in obj.group) obj = obj.group.index;

  // If the module was found, load it
  if (!obj.mod) {
    // If a group field is present, check to see if an index module is present
    if (obj.group) {
      throw new Error('Could not find index.js in '+name);
    // ... otherwise we're loading just a single module
    } else {
      loadModule(obj);
      return obj.mod.exports;
    }
  } else return obj.mod.exports;
}

fs.template = function(name,notRequired) {
  // Search for the module
  var path = name.split('/');
  var obj = libtmp;
  for (var k in path) {
    var next = obj[path[k]];
    if (next) {
      if (k<path.length-1) obj = next.group
      else obj = next;
    } else if (!notRequired) { throw Error('Failed to find template '+name); }
  }

  // If the module was found, load it
  return obj.template;
}

/**
 * Extends a child object from a parent object using classical inheritance
 * pattern (derived from apache cordova).
 */
fs.extend = (function() {
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

function replaceDOM(clsTemplate,v) {
  var elem = $(v);
  var styles = elem.attr('style');
  var classes = elem.attr('class');

  var newDOM = $(clsTemplate).replaceAll(elem);

  // Apply original classes to the new DOM
  if (classes) {
    classes = classes.split(' ');
    for (var k in classes) {
      newDOM.addClass(classes[k]);
    }
  }

  // Apply original styles to the new DOM
  if (styles) {
    styles = styles.split(';');
    for (var k in styles) {
      if (!styles[k]) continue;
      var nv = styles[k].trim().split(':');
      newDOM.css(nv[0].trim(),nv[1].trim());
    }
  }

  // Mark this element as mixed
  newDOM.attr('mixed','mixed');

  return newDOM;
/*  // If we matched something different than the className, we need to
  // add the matchName class to the new dom object
  if (className != matchName) newDOM.addClass(matchName);
*/
}

fs.mix = function(parent,name,args,options) {
  // Make sure bind has been called on the parent
  if (!parent.__isBound) throw new Error('Attempt to mix '+name+' into a parent with no applied bindings. Call bind first!');

  // Make sure an options object exists
  options = options || {};

  // Use require to get the class constructor for the view model
  var clsConstructor = fs.require(name);

  var templateName = options.templateName || name;

  // Determine the class name
  var className = name.replace(/\//g,'-');
  var classTemplateName = templateName.replace(/\//g,'-');

  // Use template to get the jade templeate
  var clsTemplate = fs.template(templateName,true) || '<div class="'+classTemplateName+'">';

  // Create the template dom
  var tmp = $(clsTemplate);

  // Determine if the class name matches the jade template's root div
  if (tmp.length != 1)
    throw new Error('The jade template meant for mixing ('+name+') must have only 1 root div, found '+tmp.length+'.');
  if (!tmp.hasClass(classTemplateName))
    throw new Error('The jade template meant for mixing ('+classTemplateName+') must have a root div with class "'+classTemplateName+'".');

  if (!('dom' in parent))
    throw new Error('The parent view model must contain a jquery object named "dom".');


  function constructMixedElement(newDOM) {
    var isBound = false;
    function bind(vm) {
      vm.dom = newDOM;
      vm.parent = args.parent;
      vm.templateName = name;
      vm.__isBound = true;
      if (vm.__bindEditable && !vm.__editing) vm.__bindEditable();

      try {
        ko.applyBindings(vm,newDOM[0]);
      } catch(e) {
        throw new Error(name+': '+e.message);
      }

      isBound = true;
    }

    // Make sure that args contains references to dom and parent
    args = args || {};
    args.dom = newDOM;
    args.parent = args.parent || parent;

    // Create the view model, or use an existing one
    if (!options.model)
      var vm = new clsConstructor(bind,args)
    else var vm = options.model;

    if (!isBound) bind(vm);

    return vm;
  }

  // Determine the match name from the options argument or from the class name
  var matchName = options.matchName || className;

  // Try to match all unmixed elements
  var dom = $('.'+matchName+'[mixed!="mixed"]',parent.dom);

  // Select the first element if we're just mixing the first match
  if (options.mixFirst) dom.length = 1;

  // Process the elements
  if (dom.length > 1) {
    var res = [];
    dom.each(function(i,v) {
      // Replace the DOM object with the appropriate template
      var newDOM = replaceDOM(clsTemplate,v);

      // Apply bindings, etc
      var vm = constructMixedElement(newDOM);

      // Add this view model to the results array
      res.push(vm);
    });
  } else if (dom.length == 1) {
    // Replace the DOM object with the appropriate template
    var newDOM = replaceDOM(clsTemplate,dom);

    // Apply bindings, etc
    res = constructMixedElement(newDOM);
  } else {
    throw new Error(name+': Could not locate an instance of '+matchName+' in the provided dom object.');
  }
  return res;
}

fs.include = function(parent,name) {
  // Use template to get the jade templeate
  var clsTemplate = template(name);

  // Create the template dom
  var tmp = $(clsTemplate);

  // Determine the class name (must match the class of jade template's root div)
  var className = name.replace(/\//g,'-');
  if (tmp.length != 1)
    throw new Error('The jade template meant for including ('+name+') must have only 1 root div, found '+tmp.length+'.');
  if (!tmp.hasClass(className))
    throw new Error('The jade template meant for including ('+name+') must have a root div with class "'+className+'".');

  if (!('dom' in parent))
    throw new Error('The parent view model must contain a jquery object named "dom".');


  var dom = $('.'+className,parent.dom);
  if (dom.length > 1) {
    var res = [];
    dom.each(function(i,v) {
      var newDOM = $(v).replaceWith(clsTemplate);
      res.push(newDOM);
    });
  } else if (dom.length == 1) {
    var newDOM = $(clsTemplate).replaceAll(dom);
    res = newDOM;
  } else {
    throw new Error('Could not locate an instance of '+className+' in the provided dom object.');
  }
  return res;
}

fs.mixAppend = function(targetDOM,name,args,options) {
  var className = name.replace(/\//g,'-');
  if (typeof targetDOM == 'string')
    var dom = $(targetDOM)
  else var dom = targetDOM;
  dom.append('<div class="'+className+'">');
  return fs.mix({dom:dom,__isBound:true},name,args,options);
}

fs.mixReplace = function(targetDOM,name,args,options) {
  fs.empty(targetDOM);
  return fs.mixAppend(targetDOM,name,args,options);
}

fs.mixFirst = function(parent,name,args,options) {
  options = options = {};
  options.mixFirst = true;
  return fs.mix(parent,name,args,options);
}

fs.empty = function(dom) {
  if (dom.attr('mixed')) dom.attr('mixed','unmixed');
  ko.cleanNode(dom);
  dom.empty();
}

fs.unmix = function(target) {
  ko.cleanNode(target.dom);
  target.dom.remove();
}

fs.DataObj = function() {};
fs.DataObj.prototype.init = function() {}

function isNotANumber(value) {
  return isNaN(value) || !value || value.length || value=='';
}

fs.transpose = function(data,objClass,objs) {
  if (!objs) objs = [];

  // Make sure an object class is provided
  if (!objClass) {
    objClass = fs.DataObj;
  }

  // Determine number of items in array
  var count = 0;
  for(var column in data) {
    count = data[column].length;
    break;
  }

  // Create Objects
  for (var k=0;k<count;k++) {
    var obj = new objClass();
    for (var column in data) {
      var value = data[column][k];

      if (typeof obj[column] == 'function')
        obj[column](isNotANumber(value)?value:+value);
      else obj[column] = isNotANumber(value)?value:+value;
    }
    if (obj.init) obj.init();
    objs.push(obj);
  }
  return objs;
}

fs.index = function(key,data,objClass) {
  var index = {};
  var res = fs.transpose(data,objClass);
  for (var k in res)
    index[res[k][key]] = res[k];
  return index;
}

fs.run = function(pageName) {
  // Get the end-user-defined startup script
  var startup = fs.require('core/startup');

  // If we have a pageName, we're dealing with a dynamically generated page
  // controlled by a javscript file in `page/pageName`
  if (pageName) {
    // Set the `pageName` as a global
    window.pageName = pageName+'.js';

    // Always run always happens before run and doesn't contain any
    // page-specific data. This is mostly for doing things like binding
    // logout scripts or other very low-level actions
    startup.alwaysRun();

    // Run startup
    startup.run('page/'+pageName);

  // Otherwise we're dealing with a static page so we fire alwaysRun and
  // nothing else
  } else startup.alwaysRun();
}

function handleRequestError(fail) {
  return function (jqXHR) {
    if (jqXHR.status == 0) {
      onConnectionError();
    } else {
      // Try to parse the JSON response object if one was provided
      var response = null;
      try {
        response = JSON.parse(jqXHR.responseText);
      } catch(e) { }

      // If a response was received, let's pass it to the appropriate handler
      if (response) {
        if ((jqXHR.status >= 400) && (jqXHR.status < 500)) {
          if (fail) fail(response,jqXHR.status)
          else onRequestError(response,jqXHR.status);
        } else if (jqXHR.status >= 500) {
          onInternalServerError(response,jqXHR.status);
        }
      } else {
        onInternalServerError(jqXHR.status,null);
      }
    }
  }
}

var api = '';
var onInternalServerError = function(res,code) {
  alert('Server returned a '+code);
};
var onRequestError = function(res,code) {
  alert('Server returned a '+code);
};
var onSyncError = function(error,updates) {
  alert('A sync error occured on the page. You might need to refresh the page if this continues.');
};
var onAlert = null;
var onPrompt = null;
var onPassword = null;
var onConfirm = null;
var onConnectionError = null;
var onAPICall = null;

fs.onSyncError = function(handler) {
  onSyncError = handler;
}

fs.onInternalServerError = function(handler) {
  onInternalServerError = handler;
}

fs.onRequestError = function(handler) {
  onRequestError = handler;
}

fs.onConnectionError = function(handler) {
  onConnectionError = handler;
}

fs.onAPICall = function(handler) {
  onAPICall = handler;
}

fs.setAPIVersion = function(version) {
  api = version;
}

/*exports.parseResult = function(onSuccess,onFail,onInternalFail) {
  return function(result) {
    try {
      // NOTE: This catch for strings may not even be necessary
      if (typeof result == 'string')
        result = JSON.parse(result)
      else result = result;
    } catch(e) {
      result = null;
      var newResult = {error:{
        msg:'Unknown internal error. Please report this as a bug.',
        type:'Internal'
      }};
      alert(newResult.error.msg);
      if (onInternalFail) {
        onInternalFail(newResult);
      }
    }
    if (result != null) {
      if ('success' in result) {
        // For synchronization purposes, check to see if we have a list of syncIDs
        console.log('about to call syncIDs');
        if ('syncIDs' in result) {
          for (var k in result.syncIDs)
            syncIDs[result.syncIDs[k]] = true;
        }

        // Fire the success callback
        if (onSuccess)
          onSuccess(result);
      } else {
        alert(result.error.msg);
        if (onFail) {
          onFail(result);
        }
      }
    }
  }
}*/

fs.get = function(url,args,success,fail) {
  return $.ajax({
    type: 'GET',
    url: (url[0] == '/' || url.search(':') != -1) ? url : '/'+url,
    data: args,
    dataType: 'json',
    success: success,
    error: handleRequestError(fail)
  });
}

fs.post = function(url,args,success,fail) {
  return $.ajax({
    type: 'POST',
    url: (url[0] == '/' || url.search(':') != -1) ? url : '/'+url,
    data: args,
    dataType: 'json',
    success: success,
    error: handleRequestError(fail)
  });
}

fs.error = function(cb) {
  return function(res,code) {
    onRequestError(res,code);
    if (cb) cb();
  }
}

fs.action = function(object,action,args,success,fail) {
  // Get the resource definition
  var resource = object._resource;

  // Make sure the id of the object is passed in the body of the post request
  args[resource.key] = object[resource.key];

  // Add the sync timestamp to the body of the request
  args.__sync = lastSyncTimestamp;

  // Allow the application to execute any custom logic on the data before sending
  if (onAPICall) onAPICall(object,args);

  return $.ajax({
    type: 'POST',
    url: '/'+api+'/'+resource.route+'/'+action,
    data: args,
    dataType: 'json',
    success: updateProcessor(success),
    error: handleRequestError(fail)
  });
}

fs.read = function(route,key,args,success,fail) {
  // Allow the application to execute any custom logic on the data before sending
  if (onAPICall) onAPICall({},data);

  // Add the sync timestamp to the body of the request
  args.__sync = lastSyncTimestamp;

  return $.ajax({
    type: 'GET',
    url: '/'+api+'/'+route+'/'+key,
    data: args,
    dataType: 'json',
    success: success,
    error: handleRequestError(fail)
  });
}

fs.computedTimestamp = function(self) {
  var buf = ko.observable();
  return ko.computed({
    read: function () {
      return buf();
    },
    write: function (value) {
      buf(new Date(value));
    },
    owner: self
  });
}

function pad(number, length) {
  var str = '' + number;
  while (str.length < length) {
    str = '0' + str;
  }

  return str;
}

fs.TimeData = function(value) {
  this.h = value.h;
  this.m = value.m;
  this.s = value.s;
}

fs.TimeData.prototype.toString = function() {
  return pad(this.h,2)+':'+pad(this.m,2)+':'+pad(this.s,2);
}

fs.computedTime = function(self) {
  var buf = ko.observable();
  return ko.computed({
    read: function () {
      return buf();
    },
    write: function (value) {
      if (typeof value == 'string') {
        var parts = value.split(':');
        buf(new fs.TimeData({h:+parts[0],m:+parts[1],s:+parts[2]}));
      } else buf(value);
    },
    owner: self
  });
}

fs.DateData = function(value) {
  this.y = value.y;
  this.m = value.m;
  this.d = value.d;
}

fs.DateData.prototype.toString = function() {
  return pad(this.y,4)+'-'+pad(this.m,2)+'-'+pad(this.d,2);
}

fs.computedDate = function(self) {
  var buf = ko.observable();
  return ko.computed({
    read: function () {
      return buf();
    },
    write: function (value) {
      if (typeof value == 'string') {
        var parts = value.split('-');
        buf(new fs.DateData({y:+parts[0],m:+parts[1],d:+parts[2]}));
      } else buf(value);
    },
    owner: self
  });
}

function extractData(fieldDef,dataContainer) {
  if (typeof dataContainer == 'function')
    return dataContainer()
  else return dataContainer;
}

function extractDataModel(object) {
  // Get the resource definition
  var resource = object._resource;

  // Extract the data model values from the object
  var data = {};
  for (var k in resource.model) {
    var value = extractData(resource.model[k],object[k]);

    if (value !== null && value !== '' && value !== undefined) {
      if ('format' in resource.model[k]) {
        data[k] = value.toString();
      } else data[k] = value;
    }
  }

  // If an expects clause is present, extract this data as well
  if (resource.expects) {
    for (var k in resource.expects)
      if (k in object)
        data[k] = extractData(resource.expects[k],object[k]);
  }

  return data;
}

// Syntax:
//   fs.create(object,success,fail)
//     - or -
//   fs.create(route,data,success,fail)
fs.create = function() {

  if (typeof arguments[0] == 'string') {
    var route = arguments[0];
    var data = arguments[1];
    var object = null;
    var success = arguments.length > 2 ? arguments[2] : null;
    var fail = arguments.length > 3 ? arguments[3] : null;

    // Get the resource definition
    var resource = libapi[route];
  } else {
    var object = arguments[0];
    var success = arguments.length > 1 ? arguments[1] : null;
    var fail = arguments.length > 2 ? arguments[2] : null;

    // Get the resource definition
    var resource = object._resource;

    // Extract the data model values from the object
    var data = extractDataModel(object);
  }

  // Add the sync timestamp to the body of the request
  data.__sync = lastSyncTimestamp;

  // Allow the application to execute any custom logic on the data before sending
  if (onAPICall) onAPICall(object || {},data);

  return $.ajax({
    type: 'POST',
    url: '/'+api+'/'+resource.route,
    data: data,
    dataType: 'json',
    success: function(res) {
      // If an object was passed, update it's id and add it to the index
      if (object) {
        object[resource.key] = res.id;
        object['_'+resource.key](res.id);
        libindex[res.route][res.id] = object;
      }

      // Process all of the incoming updates
      processUpdates(res.updates);

      // Call the success handler
      if (success) success(libindex[res.route][res.id]);
    },

/*    function(res) {
      // Assign id to the object
      object[resource.key] = res.id;
      object['_'+resource.key](res.id);

      success(res);
    },*/
    error: handleRequestError(fail)
  });
}

fs.update = function(object,success,fail) {
  // Get the resource definition
  var resource = object._resource;

  // Make sure this object has an id
  if (!object[resource.key]) return;

  // Extract the data model values from the object
  var data = extractDataModel(object);

  // Add the sync timestamp to the body of the request
  data.__sync = lastSyncTimestamp;

  // Allow the application to execute any custom logic on the data before sending
  if (onAPICall) onAPICall(object,data);

  return $.ajax({
    type: 'PUT',
    url: '/'+api+'/'+resource.route+'/'+object[resource.key],
    data: data,
    dataType: 'json',
    success: updateProcessor(success),
    error: handleRequestError(fail)
  });
}

fs.save = function(object,success,fail) {
  // Check if the model needs to be created or updated
  if (!object[object._resource.key]) {
    fs.create(object,success,fail);
  } else fs.update(object,success,fail);
}

fs.updateField = function(object,field,success,fail) {
  // Get the resource definition
  var resource = object._resource;

  // Make sure this object has an id
  if (!object[resource.key]) return;

  // Extract the value of the field to be updated
  var data = {};
  data[field] = object[field]();

  // Add the sync timestamp to the body of the request
  data.__sync = lastSyncTimestamp;

  // Allow the application to execute any custom logic on the data before sending
  if (onAPICall) onAPICall(object,data);

  return $.ajax({
    type: 'PUT',
    url: '/'+api+'/'+resource.route+'/'+field+'/'+object[resource.key],
    data: data,
    dataType: 'json',
    success: updateProcessor(success),
    error: handleRequestError(fail)
  });
}

fs.destroy = function(object,success,fail) {
  // Get the resource definition
  var resource = object._resource;

  // Define an object to return to the server
  var args = {};

  // Add the sync timestamp to the body of the request
  args.__sync = lastSyncTimestamp;

  // Allow the application to execute any custom logic on args before sending
  if (onAPICall) onAPICall(object,args);

  return $.ajax({
    type: 'DELETE',
    url: '/'+api+'/'+resource.route+'/'+object[resource.key],
    data: args,
    dataType: 'json',
    success: updateProcessor(success),
    error: handleRequestError(fail)
  });
}

fs.setModel = function(obj,modelName,keyValue) {
  var resource = libapi[modelName];
  if (resource) {
    // Keep a reference to the resource definition
    obj._resource = resource;

    // Associate the key with an observable on the object
    obj[resource.key] = keyValue;
    obj['_'+resource.key] = ko.observable(keyValue);

    // Create the data model observables
    for (var k in resource.model) {
      var def = resource.model[k];
      switch(def.type) {
        case 'document':
          // Create the human-readable fields as observables
          for (var j in def.properties) {
            var prop = def.properties[j];
            obj[prop.symb?prop.symb:j] = prop.type!='array'?ko.observable():ko.observableArray();
          }

          // Create a read/write computed observable that will handle i/o for
          // the fields created above
          obj[k] = fs.observableJSONDocument(obj,def.properties);
          break;
        case 'array':
          if ('default' in def)
            obj[k] = ko.observableArray(def['default'])
          else obj[k] = ko.observableArray();
          break;
        case 'string':
          if ('format' in def) {
            switch(def.format) {
              case 'date-time':
                obj[k] = fs.computedTimestamp(obj);
                break;
              case 'date':
                obj[k] = fs.computedDate(obj);
                break;
              case 'time':
                obj[k] = fs.computedTime(obj);
                break;
              default:
                obj[k] = ko.observable();
            }
          } else if ('default' in def)
            obj[k] = ko.observable(def['default'])
          else obj[k] = ko.observable();

          break;
        default:
          if ('default' in def)
            obj[k] = ko.observable(def['default'])
          else obj[k] = ko.observable();
      }
    }
  } else throw new Error('Could not find resource '+modelName+' in api.');
}

fs.getIndex = function(route,idx) {
  if (idx === undefined)
    return libindex[route]
  else return libindex[route][idx];
}

fs.load = function(route,data) {
  var resource = libapi[route];
  //var skip = null;

  if (resource) {
    // Get the appropriate controller for the data
    var controller = fs.require(resource.controller);

    // Get the appropriate index for the data
    var index = libindex[route];

    // Determine number of items in array
    var count = 0;
    for(var column in data) {
      count = data[column].length;
      break;
    }

    // Create Objects
    for (var k=0;k<count;k++) {
//  DO NOT DELETE - for testing sync engine
//      if (skip) {
//        if (skip[route]) {
//          if (data[resource.key][k] > skip[route]) continue;
//        }
//      }

      // If something is already in the index, use that object
      if (data[resource.key][k] in index) {
        var obj = index[data[resource.key][k]];
        var isNew = false;
      } else {
        var obj = new controller(data[resource.key][k]);
        var isNew = true;
      }

      for (var column in data) {
        var value = data[column][k];

        if (typeof obj[column] == 'function')
          obj[column](isNotANumber(value)?value:+value);
        else obj[column] = isNotANumber(value)?value:+value;
      }

      // Assign the object to the appropriate index
      index[obj[resource.key]] = obj;

      // Send a message that a new object has been created
      if (isNew) {
        $(document).trigger('fs.create:'+route,[obj]);
        $('.fs-listener').trigger('fs.create:'+route,[obj]);
      }
    }
  } else throw new Error('Could not find '+route+'. Has the RESTful resource been defined?');
}

fs.onCreate = function(route,handler) {
  // Get the appropriate index for the data
  var index = libindex[route];

  // Loop through the index and call the handler for everything currently
  // in the index
  for (var k in index)
    handler(index[k]);

  // Define an event listener that will call the handler each time a
  // new object is created
  $(document).on('fs.create:'+route,function(e,obj) {
    handler(obj);
  });
}

fs.onDestroy = function(route,handler) {
  $(document).on('fs.destroy:'+route,function(e,obj) {
    handler(obj);
  });
}

fs.observableJSONDocument = function(self,map) {
  return ko.computed({
    read: function () {
      var obj = {};
      for (var k in map) {
        var value = this[map[k].symb?map[k].symb:k]();
        if (value !== null && value !== '')
          obj[k] = value;
      }
      return obj;
    },
    write: function (value) {
      var obj = typeof(value)=='string'?JSON.parse(value):value;
      for (var k in map)
        this[map[k].symb?map[k].symb:k](obj[k]);
    },
    owner: self
  });
}

// These are called internally by sync
function onCreate() {

}

function onUpdate() {

}

function onUpdateField() {

}

function onDestroy() {

}

// Determines how often the server is polled for updates
var syncInterval = 5000;

// This value will be overwritten in startSync is called (which is what should
// be called if you want synchronization to work at all)
var lastSyncTimestamp = (new Date()).getTime();

function sync() {
// DO NOT DELETE -- THIS CODE IS IMPORTANT FOR SYNCING
// DO NOT DELETE -- THIS CODE IS IMPORTANT FOR SYNCING
// DO NOT DELETE -- THIS CODE IS IMPORTANT FOR SYNCING
/*  setTimeout(function() {
    $.ajax({
      type : 'POST',
      url : 'sync',
      data : {
        g: groupID,
        m: MID,
        timestamp: lastSyncTimestamp,
      },
      dataType : 'json',
      success: function(res) {
        if ('success' in res) {
          processUpdates(res.updates);
        }

        // Start the timer to sync again
        sync();
      },
      error: function(req,status) {
        // Start the timer to sync again
        sync();
      },
      timeout: 20,
    });
  },syncInterval);*/
}

function processSyncMessage(msg) {
  // Add the userID to the args list if a userID isn't already present so that
  // the receiving object will know who performed the action
  if (!msg.args.userID)
    msg.args.userID = msg.userID;

  // Determine what action to take
  switch(msg.action) {
    case 'create':
      // Get the resource definition
      var resource = libapi[msg.res];

      // Get the appropriate controller for the data
      var controller = fs.require(resource.controller);

      // Get the appropriate index for the data
      var index = libindex[msg.res];

      // Check the index to make sure the object doesn't already exist, and if
      // it doesn't, create it
      var obj = index[msg.id];
      if (!obj) {
        // Create a new object and assign an id to it
        var obj = new controller(msg.id);
        obj[resource.key] = msg.id;
        obj['_'+resource.key](msg.id);

        // Assign the object to the appropriate index
        index[obj[resource.key]] = obj;
      }

      // Loop through the initialization arguments
      for (var k in msg.args)
        if (typeof obj[k] == 'function') {
          var value = msg.args[k];
          obj[k](isNotANumber(value)?value:+value);
        }

      // Fire an event that lets all listeners know the object has been created
      $(document).trigger('fs.create:'+msg.res,[obj]);
      $('.fs-listener').trigger('fs.create:'+msg.res,[obj]);

      break;

    case 'update':
      // Get the object that will be modified
      var obj = fs.getIndex(msg.res,msg.id);

      // Loop through the updated arguments
      for (var k in msg.args)
        if (typeof obj[k] == 'function') {
          var value = msg.args[k];
          obj[k](isNotANumber(value)?value:+value);
        }

      break;

    case 'destroy':
      // Get the object that will be destroyed
      var index = fs.getIndex(msg.res);
      var obj = index[msg.id];

      // If the object exists, fire an event that lets all listeners know the
      // object has been destroyed
      if (obj) {
        $(document).trigger('fs.destroy:'+msg.res,[obj]);
        $('.fs-listener').trigger('fs.destroy:'+msg.res,[obj]);

        // Remove the object from the index
        delete index[msg.id];
      }

      break;

    default:
      // Get the object that will be modified
      var object = fs.getIndex(msg.res,msg.id);

      // Call the appropriate handler
      object[msg.action](msg.args);
  }
}

var knownUpdates = {};

function hashUpdate(update) {
  return md5(JSON.stringify(update));
}

function processUpdates(updateData) {

  var updates = fs.transpose(updateData);

  // Sort updates in chronological order
  updates.sort(function(a,b) {
    return a.timestamp > b.timestamp ? 1 : a.timestamp < b.timestamp ? -1 : 0;
  });

  // Loop through and apply all updates

  if (updates.length) {
    for (var k in updates) {
      console.log(updates[k].syncID);

      // Determine the timestamp of this update
      var thisTimestamp = new Date(updates[k].timestamp).getTime();

      // Only process this update if it's timestamp is ahead of the lastSyncTimestamp
      var hash = hashUpdate(updates[k]);
      if (!knownUpdates[hash]) {
        try {
          processSyncMessage(updates[k].data);
        } catch(e) {
          onSyncError(e,updates);
        }
      }
      knownUpdates[hash] = true;
    }
    lastSyncTimestamp = thisTimestamp;
  }

}

function updateProcessor(success) {
  return function(res) {
    processUpdates(res.updates);

    if (success) success(res);
  }
}

fs.startSync = function(syncTimestamp) {
  // Set the timestamp to start syncing from
  lastSyncTimestamp = syncTimestamp;

  // Start the timer to sync
  sync();
}

fs.ajaxLoad = function(vm,url,args) {
  args = args || {};

  // Timeout is required to give the dom a chance to process the ajax-loader div
  setTimeout(function() {
    fs.post(url,args,function(res) {
      $('.ajax-loader',vm.dom).trigger('fs.ajax-loaded');
      vm.load(res);
    });
  },50);
}

fs.onAlert = function(handler) {
  onAlert = handler;
}

fs.alert = function(msg,title,level,cb) {
  if (onAlert) {
    if (typeof title == 'function')
      onAlert(msg,null,null,title)
    else onAlert(msg,title,level,cb);
  } else { alert(msg); if (cb) cb(); }
}

fs.onConfirm = function(handler) {
  onConfirm = handler;
}

fs.confirm = function(msg,title,level,yes,no) {
  if (onConfirm) {
    if (typeof title == 'function')
      onConfirm(msg,null,null,title,level)
    else onConfirm(msg,title,level,yes,no);
  } else cb(confirm(msg));
}

fs.onPrompt = function(handler) {
  onPrompt = handler;
}

fs.onPassword = function(handler) {
  onPassword = handler;
}

fs.prompt = function(msg,title,level,cb,value,cancel) {
  if (onPrompt) {
    if (typeof title == 'function')
      onPrompt(msg,null,null,title,level)
    else onPrompt(msg,title,level,cb,value,cancel);
  } else cb(prompt(msg));
}

fs.password = function(msg,title,level,cb) {
  if (onPassword) {
    if (typeof title == 'function')
      onPassword(msg,null,null,title)
    else onPassword(msg,title,level,cb);
  } else alert('No password prompt handler has been defined. Use fs.onPassword(handler).');
}

fs.listen = function(event,dom,handler) {
  dom.bind(event,handler);
  dom.addClass('fs-listener');
}

function EditableList(parent,target) {

}


function MixList(parent,target,editing) {
  // The actual list of view models
  this.items = [];

  // Store the parent for future use
  this.parent = parent;

  // The item currently being edited (if any)
  this.editing = editing || ko.observable(null);

  // Number of items in the list (for display purposes)
  this.length = ko.observable(0);

  // Get a jQuery reference to the appropriate element into which list items
  // will be inserted
  if (parent.dom) {
    this.dom = $(target,parent.dom);
    if (!this.dom.length) throw new Error(parent.templateName+': Could not locate '+target+' in provided DOM object. Please include it or I won\'t know where to put the MixList!');

    // This isn't really true b/c sometimes the MixList is called before bind,
    // but it makes things easier in the long run and doesn't cause too much
    // damage.
    this.__isBound = true;

  } else throw new Error('Could not find a reference to dom in the parent, assign dom first or call bind!');
}

MixList.prototype.source = function(route,viewModel,options) {
  // Make sure bind has been called on the parent
  if (!this.parent.__isBound) throw new Error('Attempt to source MixList at on a parent with no applied bindings. Call bind first!');

  var self = this;
  options = options || {};

  // If a filter was not provided, use the default
  var seive = options.filter || function() { return true; };

  // The route through which data is manipulated
  this.route = route;

  // The viewModel that will be assigned to any new data added to the list
  // The view model should expect to access the data model through args.model
  this.viewModel = viewModel;

  // A filter that is applied to any new items before they are inserted.
  // The filter is applied only during the construction of the list and at
  // events and not from list operations like push.
  this.seive = seive;

  // These are non-null when pagination is in use. `pageSize` determines the
  // number of items that are displayed when `next()` is called. `buffer`
  // contains all the items that haven't yet been displayed
  this.pageSize = options.pageSize || 0;
  this.buffer = this.pageSize ? [] : null;

  // Determine the index from which to pull data
  var index = libindex[route];
  if (!index) throw new Error('An index could not be found for '+route+'. Has the RESTful resource been defined?');

  // Initial list population and handling for the creation of future objects:
  // By default, we populate from the main index of the resource and listen for
  // fs.create and fs.destroy events to manipulate the list. However, if an
  // observable array was passed as an alternate source, we subscribe to it
  // and use this as an initial source
  if (!options.source) {

    // Populate the list based on the current contents of a given index
    this.populateList(index);

    // Handling for the creation of future objects
    this.createHandler = $(document).on('fs.create:'+this.route,function(e,object) {
      if ((!self.seive || self.seive(object)) && (self.indexOf(object) == -1)) {
        // Remove any temporary objects that were used as a UI for creating the new object
        var idx = self.removeTemp();
        if (idx == -1) idx = self.items.length;

        // Insert the newly created object
        if (options.filter && options.filter(object)) {
          self.insert(idx,self.viewModel,{
            model: object,
          });
        } else {
          self.insert(idx,self.viewModel,{
            model: object
          });
        }
      }
    });

    // Handling for the destruction of objects
    this.destroyHandler = $(document).on('fs.destroy:'+this.route,function(e,object) {
      self.remove(object);
    });

  // ... otherwise we have an observable array as an alternate source
  } else {
    // Populate the list based on the current contents of a given index

    this.populateList(options.source());

    // Subscribe to the observable array for future updates
    options.source.subscribe(function() {
      var source = options.source();

      // Determine the ids that are currently in the list
      var ids = {};
      var k = 0;
      while (k < self.items.length) {
        // Get the model of the item
        var model = self.items[k].__model;

        // If the model does not exist in the source array
        if (source.indexOf(model) == -1) {
          self.removeAt(k);
        // ... otherwise if it exists, add it to the array of existing items
        } else {
          var id = model[model._resource.key];
          ids[id] = true;
          k++;
        }
      }

      // Add any missing ids
      for (var k in source) {
        var model = source[k];
        var id = model[model._resource.key];
        if (!ids[id])
          self.push(self.viewModel,{model: model});
      }
    });
  }

  return this;
}

MixList.prototype.populateList = function(index) {
  // If the list is not paginated, we populate it immediately. Otherwise,
  // we buffer the content and show only the first page
  if (!this.pageSize) {
    // Loop through the index and populate the list conditioned on the filter
    if (this.seive) {
      for (var k in index)
        if (this.seive(index[k]))
          this.push(this.viewModel,{
            model: index[k],
          });
    } else for (var k in index) {
      this.push(this.viewModel,{
        model: index[k]
      });
    }
  } else {
    // Loop through the index and populate the buffer conditioned on the filter
    if (this.seive) {
      for (var k in index)
        if (this.seive(index[k]))
          this.buffer.push(index[k]);
    } else for (var k in index) {
      this.buffer.push(index[k]);
    }
  }

  // Update the list size
  this.length(this.items.length);
}

MixList.prototype.unsource = function() {
  if (this.createHandler) $(document).off('fs.create:'+this.route,this.createHandler);
  if (this.destroyHandler) $(document).off('fs.destroy:'+this.route,this.destroyHandler);
}

function doMix(parent,name,args,options) {
  args = args || {model: {}};
  var vm = fs.mix(parent,name,args,options);
  vm.__model = args.model;
  if (vm.__bindEditable) vm.parent = parent;
  vm.dom.data('vm',vm);
  return vm;
}

MixList.prototype.push = function(name,args,options) {
  this.dom.append('<div class="'+name.replace(/\//g,'-')+'">');
  var vm = doMix(this,name,args,options);
  this.items.push(vm);

  // Update the list size
  this.length(this.items.length);

  return vm;
}

MixList.prototype.insert = function(idx,name,args,options) {
  if (idx == 0) this.dom.prepend('<div class="'+name.replace(/\//g,'-')+'">');
  else if (idx < this.items.length) $('<div class="'+name.replace(/\//g,'-')+'">').insertBefore(this.items[idx].dom);
  else $('<div class="'+name.replace(/\//g,'-')+'">').insertAfter(this.items[idx-1].dom);
  var vm = doMix(this,name,args,options);
  this.items.splice(idx,0,vm);

  // Update the list size
  this.length(this.items.length);

  return vm;
}

MixList.prototype.pop = function() {
  this.dom.children().last().remove();

  // Update the list size
  this.length(this.items.length);

  return this.items.pop();
}

MixList.prototype.unshift = function(name,args,options) {
  this.dom.prepend('<div class="'+name.replace(/\//g,'-')+'">');
  var vm = doMix(this,name,args,options);
  this.items.unshift(vm);

  // Update the list size
  this.length(this.items.length);

  return vm;
}

MixList.prototype.shift = function() {
  this.dom.children().first().remove();

  // Update the list size
  this.length(this.items.length);

  return this.items.shift();
}

MixList.prototype.reverse = function() {
  var dom = this.dom;
  this.items.reverse();
  dom.children().each(function(i,v){dom.prepend(v)});
}

MixList.prototype.sort = function(comparator) {
  // If the list is not paginated, we can simply sort the existing items
  if (!this.pageSize) {
    // Sort the items list
    this.items.sort(comparator);

    // Rearrange the dom
    for (var k in this.items) {
      this.dom.append(this.items[k].dom);
    }

  // If the list is paginated, we collect all items and then clear the list
  // to re-render from scratch
  } else {
    // Use the buffer as a place to sort the objects (this requires adding
    // models from the items array back to the buffer)
    for (var k in this.items)
      this.buffer.push(this.items[k].__model);
    this.items.length = 0;
    this.dom.empty();

    // Sort the buffer
    this.buffer.sort(comparator);

    // Display the first page of results
    this.next();
  }
}

MixList.prototype.splice = function(idx,count) {
  var removed = this.items.splice(idx,count);
  for (var k in removed) {
    removed[k].dom.remove();
  }

  // Update the list size
  this.length(this.items.length);

  return removed;
}

MixList.prototype.move = function(oldidx,newidx) {
  // Rearrange the items array
  var tmp = this.items.splice(oldidx,1)[0];
  this.items.splice(newidx,0,tmp);

  if (newidx == 0)
    this.items[1].dom.before(tmp.dom)
  else this.items[newidx-1].dom.after(tmp.dom);

  // Update the list size
  this.length(this.items.length);
}

MixList.prototype.indexOf = function(item) {
  // Locate index by data model
  if (item._resource) {
    // Get the resource definition
    var resource = item._resource;
    if (!resource) resource = libapi[this.route];

    // Make sure this object has an id
    var id = item[resource.key];

    // See if a ViewModel in this list references this model
    var idx = -1;
    for (var k in this.items) {
      if (this.items[k].__model[resource.key] == id) {
        idx = +k;
        break;
      }
    }
    return idx;

  // ... otherwise locate index by view model
  } else return this.items.indexOf(item);
}

MixList.prototype.removeTemp = function() {
  // Get the resource definition
  var resource = libapi[this.route];

  // See if a ViewModel in this list references this model
  var item = null; var idx = -1;
  for (var k in this.items) {
    if (!this.items[k].__model[resource.key]) {
      item = this.items[k];
      idx = +k;
      break;
    }
  }
  if (item) this.remove(item.__model);
  return idx;
}

MixList.prototype.remove = function(item) {
  // Remove the item
  var idx = this.indexOf(item);
  if (idx >= 0) {
    this.items[idx].dom.remove();
    this.items.splice(idx,1);
  }

  // Update the list size
  this.length(this.items.length);
}

MixList.prototype.removeAt = function(idx) {
  // Remove the item
  if (idx >= 0) {
    this.items[idx].dom.remove();
    this.items.splice(idx,1);
  }

  // Update the list size
  this.length(this.items.length);
}

MixList.prototype.removeAll = function(options) {
  options = options || {};
  if (this.editing() && !options.removeEdits) {
    // Get the resource definition
    var resource = libapi[this.route];

    var k = 0;
    while (k < this.items.length) {
      if (this.items[k].__editing && !this.items[k].__editing()) {
        this.removeAt(k);
      } else k++;
    }
  } else {
    this.items.length = 0;
    this.dom.empty();
    if (this.buffer) this.buffer.length = 0;
    this.editing(null);
  }

  // Update the list size
  this.length(this.items.length);
}

MixList.prototype.checkForEditing = function() {
  if (this.editing()) {
    var res = confirm('Already editing! Would you like to cancel the current edit (any changes will be lost)?');
    if (res) {
      if (this.editing().__cancel) this.editing().__cancel()
      else this.remove(this.editing());
      this.editing(null);
      return true;
    } else return false;
  } else return true;
}

MixList.prototype.add = function(idx,args) {
  var self = this;
  var args = args || {};
  if (idx === null || idx === undefined) idx = this.items.length;

  // MixList.add works only if we've called MixList.source to set the
  // resource target
  if (!this.viewModel)
    throw new Error('No view model defined for adding. Try calling `list.source` first.');

  // Check to make sure we're not already editing
  if (!this.checkForEditing()) return;

  // Determine the data model that will be used for the new item
  var dataModel = require(libapi[this.route].controller);

  // Add the new item to the list
  args.model = args.model || new dataModel(null);
  var item = this.insert(idx,this.viewModel,args);

  // Switch the item to edit mode
  if (item.__edit) item.__edit()
  else this.editing(item);

  return item;
}

MixList.prototype.filter = function(seive) {
  // Change the list's filter
  this.seive = seive;

  // Determine the index from which to pull data
  var index = libindex[this.route];
  if (!index) throw new Error('An index could not be found for '+this.route+'. Has the RESTful resource been defined?');

  // Clear the list and then repopulate
  this.removeAll();
  this.populateList(index);
}

MixList.prototype.next = function(cb) {
  // Loop through up to page size and mix the buffered models
  for (var k=0;k<this.pageSize;k++) {
    if (this.buffer.length) {
      var model = this.buffer.splice(0,1)[0];
      this.push(this.viewModel,{model:model});
    }
  }
  if (cb) cb(this.buffer.length);
}

// Mixable list (replaces observableArray since further mixing into items of an
// observable array is impossible
fs.mixList = function(parent,target,editing) {
  var list = new MixList(parent,target,editing);


  return list;
}

fs.makeEditable = function(View) {
  View.prototype.__bindEditable = function() {
    this.__editing = ko.observable(false);
    this.__destroyed = false;
  }

  View.prototype.__edit = function() {
    var self = this;
    if (!this.parent.checkForEditing || this.parent.checkForEditing()) {
      if (!this.onEdit) {
        if (this.__model && this.__model.beginEdit) this.__model.beginEdit();
        this.__editing(true);
        if (this.parent.editing) this.parent.editing(this);
      } else {
        this.onEdit(function() {
          if (this.__model && this.__model.beginEdit) this.__model.beginEdit();
          self.__editing(true);
          if (self.parent.editing) self.parent.editing(self);
        });
      }
    }
  }

  View.prototype.__save = function(cb) {
    var self = this;

    // Check if the model needs to be created or updated
    if (!this.__model[this.__model._resource.key]) {
      fs.create(this.__model,function() {
        if (self.parent.editing) self.parent.editing(null);
        self.__editing(false);

        // Commit changes if the model has recorded the original state
        if (self.__model && self.__model.commit) self.__model.commit();

        if (cb) cb();
      });
    } else fs.update(this.__model,function() {
      if (self.parent.editing) self.parent.editing(null);
      self.__editing(false);

      // Commit changes if the model has recorded the original state
      if (self.__model && self.__model.commit) self.__model.commit();

      if (cb) cb();
    });

  }

  View.prototype.__cancel = function() {
    this.__editing(false);
    if (this.parent.editing) this.parent.editing(null);

    // Roll back any changes if the model has recorded the original state
    if (this.__model && this.__model.rollback) this.__model.rollback();

    // Determine if the object should be removed from the list
    if (!this.__model[this.__model._resource.key] && this.parent.remove)
      this.parent.remove(this.__model);
  }

  View.prototype.__destroy = function() {
    if (!this.__destroyed) fs.destroy(this.model);
    this.__destroyed = true;
  }

  // Shortcut functions
  if (!View.prototype.edit) View.prototype.edit = function() {this.__edit()};
  if (!View.prototype.save) View.prototype.save = function() {this.__save()};
  if (!View.prototype.cancel) View.prototype.cancel = function() {this.__cancel()};
  if (!View.prototype.destroy) View.prototype.destroy = function() {this.__destroy()};

  return View;
}

// Workaround for the fact that the checked binding requires strings instead
// of numbers
fs.toStrings = function(observableArray) {
  var array = observableArray();
  for (var k in array) {
    array[k] = ''+array[k];
  }
  observableArray(array);
}

// Local URL to cloud URL mapping function
fs.assets = null;
fs.asset = function(url) {
  if (fs.assets)
    return fs.assets[url];
  else return url;
}

// Define fusion mappings by underscore function
fs.Collection = function(init) { this.list = init || []; };

fs.Collection.prototype = {

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

})(fs);

var define = fs.define;
var deftmp = fs.deftmp;
var defapi = fs.defapi;
var require = fs.require;

// Having template as a global will be deprecated
var template = fs.template;

