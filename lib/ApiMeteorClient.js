/*
 * ApiMeteorClient.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
  "use strict";
  (typeof root.ili === 'undefined') && (root.ili = require('./Utils.js').ili);

  var ili = root.ili,
      heir = ili.importPackage(root, 'heir', 'heir'),
      logger = ili.import(root, 'Logger').instance,
      ApiBase = ili.import(root, 'ApiBase');

  //
  // A version of the intelligent.li API client that connects to a meteor server
  // via meteor streams. This assumes it is running in the meteor client, 
  // and that Api.js has NOT been loaded.
  function Api(host) {
    ApiBase.call(this, host);
    
    this._clientId = Meteor.uuid();
    this._sampleStream = null;

    //
    // must be called at startup providing a unique identifier for this client
    this.initialise = function() {
      this._sampleStream = new Meteor.Stream('ili.samples');
    }

    this.loadBlob = function(collection, sensor, index, alignment, notify) {
      try {
        Meteor.call("loadBlob", collection, sensor, index, alignment, this._clientId, function(error, msg) {
          if (error) {
            logger.error("failed to call load blob on server: " + error);
          } else {
            notify && notify(true, msg);
          }
        });
      } catch (e) {
        logger.error(e.toString());
        notify && notify(false);
      }
    }

    //
    // Loads the specified resource into the supplied map, notifying when done.
    // This function expects the resource to be an 'ObservableMap'
    this.loadResource = function(resource, map, notify, parser) {
      try {
        var responseParser = parser || function(map, data){
          var dataObj = JSON.parse(data);
          map.clear();
          map.disableNotification();
          for (var property in dataObj) {
            if (dataObj.hasOwnProperty(property)) {
              map.insert(property, dataObj[property]);
            }
          }
          map.enableNotification();
        }

        Meteor.call("loadResource", resource, this._clientId, function(error, msg) {
          if (error) {
            logger.error("failed to call load resource on server: " + error);
            notify && notify(false);
          } else {
            responseParser(map, msg);
            notify && notify(true);
          }
        });
      }
      catch (e) {
        logger.error(e.toString());
        notify && notify(false);
      }
    }
    var _handlers = {};

    this.subscribe = function(id, start) {
      var self = this;
      var feed = this.feedCache.get(id);

      _handlers[feed.id] = function(msg) {
        try {
          var message = JSON.parse(msg);
          feed.samples.disableNotification();
          for (var key in message)
          {
            self.loadSample(key, message[key], feed.samples);
          }
          feed.samples.enableNotification();
        }
        catch (e) {
          logger.error("error handling samples message " + e);
        }
      }
      
      this._sampleStream.on(feed.id, _handlers[feed.id]);
      
      Meteor.call("subscribe", feed.id, this._clientId, start, function(error) {
        if (typeof error != 'undefined') {
          logger.error("failed to subscribe to feed: " + error);     
        }  
      });
    }
    
    this.unsubscribe = function(id) {
      this._sampleStream.removeListener(id);
      Meteor.call("unsubscribe", id, this._clientId, function(error) {
        if (typeof error != 'undefined') {
          logger.error("failed to unsubscribe from feed: " + error);
        } 
      });
    }

    this.blobDownloader = function(id, start, end, ext, fb, name, notify) {
      Meteor.call("blobDownloader", id, start, end, ext, fb, name, function(error, result) {
        if (typeof error != 'undefined') {
          logger.error("failed to get data from feed: " + error);
        }
        logger.info("file is : " + result);
        var fileUrl = '/blobs?name=' + result;
        notify && notify(fileUrl);
      });
    }

    this.downloader = function(ids, start, end, fb, notify) {
      Meteor.call("downloader", ids, start, end, fb, function(error, result) {
        if (typeof error != 'undefined') {
          logger.error("failed to get data from feed: " + error);
        }
        logger.info("file is : " + result);
        var fileUrl = '/datafile?name=' + result;
        notify && notify(fileUrl);
      });
    }
  }
  heir.inherit(Api, ApiBase);

  root.ili.Api = Api;
  root.ili.Api.instance = new Api();

})(this);

Meteor.startup(function() {
  Meteor.call('keepalive', this.ili.Api.instance._clientId);
  Meteor.setInterval(function () {
    Meteor.call('keepalive', this.ili.Api.instance._clientId);
  }, 20000);
});
