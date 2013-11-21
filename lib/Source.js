/*
 * Source.js Copyright Percepscion Pty. Ltd.
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
  // Provides a class that represents an Intelligent.li Source.
  function Source(id) {
    Resource.call(this, "sources", id);
  }
  heir.inherit(Source, Resource);

  //
  // Provides a cache for Intelligent.li Devices
  function DeviceCache() {
    ResourceCache.call(this, "sources");
    this.create = function(id){
      return new Source(id);
    }
  }
  heir.inherit(DeviceCache, ResourceCache);

  root.ili.Source = Source;
  root.ili.sourceCache = new DeviceCache();
  root.ili.sources = root.ili.sourceCache;
})(this);    

