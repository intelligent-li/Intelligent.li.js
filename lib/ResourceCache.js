/*
 * ResourceCache.js Copyright Percepscion Pty. Ltd.
 */
var logger = require('./Logger.js');

(function(exports) {
  "use strict";

  //
  // Provides a cache for Intelligent.li resources, allowing the application
  // to share single instances of the resources throughout.
  //
  // Contains the single instance of the Resource for each actual
  // Intelligent.li Resource. Resource classes (and their subclasses) should not
  // be instantiated directly, they should be created using the appropriate
  // ResourceCache.get() function.
  function ResourceCache() {
    this.resources = {};

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
  exports.ResourceCache = ResourceCache;
})(this);