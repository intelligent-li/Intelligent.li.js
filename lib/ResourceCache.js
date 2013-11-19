/*
 * ResourceCache.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
    "use strict";

    var logger = ili_logger;
    var EventEmitter = ili_importPackage(root, 'EventEmitter', 'wolfy87-eventemitter'),
    heir = ili_importPackage(root, 'heir', 'heir'),
    logger = ili_import(root, 'Logger'),
    api = ili_import(root, 'Api'),
    ObservableMap = ili_import(root, 'ObservableMap');

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

  root.ili_ResourceCache = ResourceCache;
  ili_ResourceCache = ResourceCache;

})(this);
