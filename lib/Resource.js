/*
 * Resource.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
  "use strict";

  (typeof root.ili === 'undefined') && (root.ili = require('./Utils.js').ili);

  var ili = root.ili,
      api = ili.import(root, 'Api').instance,
      EventEmitter = ili.importPackage(root, 'EventEmitter', 'wolfy87-eventemitter'),
      heir = ili.importPackage(root, 'heir', 'heir'),
      logger = ili.import(root, 'Logger').instance,
      ObservableMap = ili.import(root, 'ObservableMap');

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
    this.tagsLoaded = null;
    this.attributesLoaded = null;
    this.locationLoaded = null;

    this.resource = function() {
      return this.type + "/" + this.id;
    }

    //
    // Load the tags for this resource from the server, and notify when done.
    this.loadTags = function(notify)
    {
      var self = this;
      if (!this.tagsLoaded) {
        logger.info("loading tags for resource " + this.resource());
        api.loadResource(this.resource() + "/tags", this.tags, function(result) {
          self.tagsLoaded = new Date();
          notify && notify(result);
        });
      } else {
        notify && notify(true);
      }
    }

    //
    // Load the Attributes of this resource from the server, and notify when done.
    this.loadAttributes = function(notify) {
      var self = this;
      if (!this.attributesLoaded){
        logger.info("loading attributes for " + this.resource());
        api.loadResource(this.resource(), this.attributes, function(result) {
          self.attributesLoaded = new Date();
          notify && notify(result);
        });
      } else {
        notify && notify(true);
      }
    }

    //
    // Load the tags for this resource from the server, and notify when done.
    this.loadLocation = function(notify) {
      var self = this;
      if (!this.locationLoaded){
        logger.info("loading location for resource " + this.resource());
        api.loadResource(this.resource() + "/location", this.location,function(result) {
          self.locationLoaded = new Date();
          notify && notify(result);
        }); 
      } else {
        notify && notify(true);
      }
    }

    //
    // Load all information (except samples) about this feed from the
    // Intelligent.li server. Calls notify when everything is loaded.
    this.load = function(notify) {
      var self = this;
      self.loadTags(function(result){
        self.loadAttributes(function(result) {
          self.loadLocation(notify);
        });
      });
    }
  }

  root.ili.Resource = Resource;
})(this);
