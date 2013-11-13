/*
 * ResourceCache.js Copyright Percepscion Pty. Ltd.
 */
  "use strict";

  if (typeof Meteor === 'undefined') {
    var logger = require('./Logger.js'),
      api = require('./Api.js').instance; 
      ObservableMap = require('./ObservableMap.js').ObservableMap;
  } else {
    var logger = ili_logger,
      ObservableMap = ili_ObservableMap,      
      api = ili_api;
  }

  //
  // Provides a cache for Intelligent.li resources, allowing the application
  // to share single instances of the resources throughout.
  //
  // Contains the single instance of the Resource for each actual
  // Intelligent.li Resource. Resource classes (and their subclasses) should not
  // be instantiated directly, they should be created using the appropriate
  // ResourceCache.get() function.
  function ResourceCache(t) {
    this.resources = {};
    this.type = t;

     //TODO: This needs unit test
     this.query = function(q, notify) {
       var queryResult = new ObservableMap();
       api.loadResource(this.type, queryResult, function() { notify(queryResult); });
     };
                         
    //this must be overriden in subclasses.
    this.create = undefined;

    this.get = function(id) {
      if (!(id in this.resources))
      {
        this.resources[id] = this.create(id);
      }
      return this.resources[id];
    }

    this.free = function(id){
      if (id in this.resources) {
        delete this.resources[id];
      }
    }
  }

  if (typeof Meteor === 'undefined') {
    exports.ResourceCache = ResourceCache;
  } else {
    ili_ResourceCache = ResourceCache;
  }

