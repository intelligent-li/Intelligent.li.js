/*
 * Device.js Copyright Percepscion Pty. Ltd.
 */
var logger = require('./Logger.js'),
    EventEmitter = require('wolfy87-eventemitter'),
    heir = require('heir'),
    Resource = require('./Resource.js').Resource,
    ResourceCache = require('./ResourceCache.js').ResourceCache;

(function(exports) {
  "use strict";
  //
  // Provides a class that represents an Intelligent.li Device.
  function Device(id) {
    Resource.call(this, "devices", id);
  }
  heir.inherit(Device, Resource);
  exports.Device = Device;

  //
  // Provides a cache for Intelligent.li Devices
  function DeviceCache() {
    ResourceCache.call(this);
    this.create = function(id){
      return new Device(id);
    }
  }
  heir.inherit(DeviceCache, ResourceCache);
  exports.deviceCache = new DeviceCache();

})(this);