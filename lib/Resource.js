/*
 * Resource.js Copyright Percepscion Pty. Ltd.
 */
  "use strict";

  if (typeof Meteor === 'undefined') {
    var api = require('./Api.js').instance,
      logger = require('./Logger.js').logger,
      EventEmitter = require('wolfy87-eventemitter'),
      ObservableMap = require('./ObservableMap.js').ObservableMap;
  } else {
    var api = ili_api,
      logger = ili_logger, 
      EventEmitter = Npm.require('wolfy87-eventemitter'),
      ObservableMap = ili_ObservableMap;
  }
  //
  // A resource is a base representation of an Intelligent.li resource, i.e.
  // Feed, Source, Device, Collection, Sensor, it encapsulates the common
  // elements of these resources such as tags and location.
  function Resource(type, id) {
    this.id = id;
    this.type = type;
    this.attributes = new ObservableMap();
    this.tags = new ObservableMap();
    this.location = new ObservableMap();

    this.resource = function() {
      return this.type + "/" + this.id;
    }
    
    //
    // Load the tags for this resource from the server, and notify when done.
    this.loadTags = function(notify)
    {
      logger.info("loading tags for resource " + this.resource());
      api.loadResource(this.resource() + "/tags", this.tags, notify);
    }

    //
    // Load the Attributes of this resource from the server, and notify when done.
    this.loadAttributes = function(notify) {
      logger.info("loading attributes for " + this.resource());
      api.loadResource(this.resource(), this.attributes, notify);
    }

    //
    // Load the tags for this resource from the server, and notify when done.
    this.loadLocation = function(notify) {
      logger.info("loading location for resource " + this.resource());
      api.loadResource(this.resource() + "/location", this.location, notify);
    }

    //
    // Load all information (except samples) about this feed from the
    // Intelligent.li server. Calls notify when everything is loaded.
    this.load = function(notify) {
      var self = this;
      self.loadTags(function(result){
        if (result) self.loadAttributes(function(result) {
            if (result) self.loadLocation(notify);
        });
      });
    }
  }
  
  if (typeof Meteor === 'undefined') {
    exports.Resource = Resource;
  } else {
    ili_Resource = Resource;
  }
