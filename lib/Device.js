/*
 * Device.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
  "use strict";
  (typeof root.ili === 'undefined') && (root.ili = require('./Utils.js'));

  var ili = root.ili,
      EventEmitter = ili.importPackage(root, 'EventEmitter', 'wolfy87-eventemitter'),
      heir = ili.importPackage(root, 'heir', 'heir'),
      logger = ili.import(root, 'Logger').instance,
      Resource = ili.import(root, 'Resource'),
      ResourceCache = ili.import(root, 'ResourceCache');

  //
  // Provides a class that represents an Intelligent.li Device.
  function Device(id) {
    Resource.call(this, "devices", id);
  }
  heir.inherit(Device, Resource);

  //
  // Provides a cache for Intelligent.li Devices
  function DeviceCache() {
    ResourceCache.call(this, "devices");
    this.create = function(id){
      return new Device(id);
    }
  }
  heir.inherit(DeviceCache, ResourceCache);

  root.ili.Device = Device;
  root.ili.deviceCache = new DeviceCache();

})(this);    

