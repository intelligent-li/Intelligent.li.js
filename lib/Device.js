/*
 * Device.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
    "use strict";

  var EventEmitter = ili_importPackage(root, 'EventEmitter', 'wolfy87-eventemitter'),
      heir = ili_importPackage(root, 'heir', 'heir'),
      logger = ili_import(root, 'Logger'),
      Resource = ili_import(root, 'Resource'),
      ResourceCache = ili_import(root, 'ResourceCache');

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

  root.ili_Device = Device;
  root.ili_deviceCache = new DeviceCache();
  ili_Device = Device;
  ili_deviceCache = root.ili_deviceCache; 
})(this);    

