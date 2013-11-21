/*
 * Collection.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
  "use strict";
  (typeof root.ili === 'undefined') && (root.ili = require('./Utils.js').ili);

  var ili = root.ili,
      EventEmitter = ili.importPackage(root, 'EventEmitter', 'wolfy87-eventemitter'),
      heir = ili.importPackage(root, 'heir', 'heir'),
      logger = ili.import(root, 'Logger').instance,
      Resource = ili.import(root, 'Resource'),
      ResourceCache = ili.import(root, 'ResourceCache');

  //
  // Provides a class that represents an Intelligent.li Collection.
  function Collection(id) {
    Resource.call(this, "collections", id);
  }
  heir.inherit(Collection, Resource);

  //
  // Provides a cache for Intelligent.li Devices
  function DeviceCache() {
    ResourceCache.call(this, "collections");
    this.create = function(id){
      return new Collection(id);
    }
  }
  heir.inherit(DeviceCache, ResourceCache);

  root.ili.Collection = Collection;
  root.ili.collectionCache = new DeviceCache();
  root.ili.collections = root.ili.collectionCache''
})(this);    

