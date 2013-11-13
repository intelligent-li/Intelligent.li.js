/*
 * Device.js Copyright Percepscion Pty. Ltd.
 */
  "use strict";
  if (typeof Meteor === 'undefined') {
    var logger = require('./Logger.js'),
      EventEmitter = require('wolfy87-eventemitter'),
      heir = require('heir'),
      Resource = require('./Resource.js').Resource,
      ResourceCache = require('./ResourceCache.js').ResourceCache;
  } else {
    var logger = ili_logger, 
      EventEmitter = Npm.require('wolfy87-eventemitter'),
      heir = Npm.require('heir'),
      Resource = ili_Resource,
      ResourceCache = ili_ResourceCache;
  } 

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

  if (typeof Meteor === 'undefined') {
    exports.Device = Device;
    exports.deviceCache = new DeviceCache();
  } else {
    ili_Device = Device;
    ili_deviceCache = new DeviceCache();
  }
    

