/*
 * Api.js Copyright Percepscion Pty. Ltd.
 */

(function(root) {
  "use strict";

  var heir = ili_importPackage(root, 'heir', 'heir'),
    logger = ili_import(root, 'Logger'),
    ApiBase = ili_import(root, 'ApiBase');

  //
  // A version of the intelligent.li API client that connects via
  // meteor streams. This assumes it is running in the meteor client, 
  // and that Apr.js has NOT been loaded.
  function Api(host) {
    ApiBase.call(this, host);
    
    this.clientId = "";
    this.sampleStream = null;
    this.resourceStream = null;

    //
    // must be called at startup providing a unique identifer
    // for this client
    this.initialise = function(clientId) {
      this.clientId = clientId;
      this.sampleStream = new Meteor.Stream('ili.samples');
      this.resouceStream = new Meteor.Stream('ili.resources');
    }

    //
    // Loads the specified resource into the supplied map, notifying when done.
    // This function expects the resource to be an 'ObservableMap'
    //
    this.loadResource = function(resource, map, notify) {
      try {
        Meteor.call("loadResource", resource, this.clientId, function(error, msg) {
          if (error) {
            logger.error("failed to call load resource on server: " + error);
          } else {
            var dataObj = JSON.parse(msg);  
            map.clear();
            map.disableNotification();
            for (var property in dataObj) {
              if (dataObj.hasOwnProperty(property)) {
                map.insert(property, dataObj[property]);
              }
            }
            map.enableNotification();
            notify(true);
          }
        });
      }
      catch (e) {
        logger.error(e.toString());
        notify(false);
      }
    }
    var handlers = {};

    this.subscribe = function(feed) {
      handlers[feed.id] = function(msg) {
        try {
          var message = JSON.parse(msg);
          feed.samples.disableNotification();
          for (var key in message)
          {
            var time = parseFloat(key);
            var value = message[key];
            value = parseFloat(value || "NaN");

           feed.samples.insert(time, value);
          }
          feed.samples.enableNotification();
        }
        catch (e) {
          logger.error("error handling samples message " + e);
        }
      }
      
      this.sampleStream.on(feed.id, handlers[feed.id]);

      Meteor.call("subscribe", feed.id, this.clientId, function(error) {
        if (typeof error != 'undefined') {
          logger.error("failed to subscribe to feed: " + error);     
        }  
      });
    }
    
    this.unsubscribe = function(feed) {
      this.sampleStream.removeListener(feed.id);

      Meteor.call("unsubscribe", feed.id, this.clientId, function(error) {
        if (typeof error != 'undefined') {
          logger.error("failed to unsubscribe from feed: " + error);
        } 
      });
    }
  }
  heir.inherit(Api, ApiBase);

  root.ili_Api = new Api();
  root.Api = Api;
  ili_api = root.ili_Api; 

})(this);