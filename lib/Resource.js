/*
 * Resource.js Copyright Percepscion Pty. Ltd.
 */

var api = require('./Api.js').instance,
    logger = require('./Logger.js'),
    EventEmitter = require('wolfy87-eventemitter'),
    ObservableMap = require('./ObservableMap.js').ObservableMap;

(function(exports) {
  "use strict";
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
    this.loadLocation = function(notify)
    {
      logger.info("loading location for resource " + this.resource());
      api.loadResource(this.resource() + "/location", this.location, notify);
    }

    //
    // Load all information (except samples) about this feed from the
    // Intelligent.li server. Calls notify when everything is loaded.
    this.load = function(notify) {
      var self = this;
      loadTags(function(){
        self.loadAttributes(notify);
      });
    }
  }

  exports.Resource = Resource;

})(this);