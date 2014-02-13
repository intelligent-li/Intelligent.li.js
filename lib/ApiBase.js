/*
 * ApiBase.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
  "use strict";
   (typeof root.ili === 'undefined') && (root.ili = require('./Utils.js').ili);

  var ili = root.ili,
      logger = root.ili.import(root, 'Logger').instance,
      ObservableMap = ili.import(root, 'ObservableMap');
  //
  // Common api interface, must be specialised before use. 
  function ApiBase(_host) {
    this._host = _host || "au.intelligent.li";
    this._port = 443;
    
    this.certs = {};

    //
    // Loads the specified resource into the supplied map, notifying when done.
    // This function expects the resource to be an 'ObservableMap'
    this.loadResource = function(resource, map, notify) {
      throw("Not implemented");
    }

    this.queryResource = function(q, type, notify) {
      var queryResult = new ObservableMap();
      this.loadResource(type + "/" + "search?q=" + q, queryResult, function(success){
        notify(success, queryResult);
      });
    }

    // this is used to avoid circular dependencies with
    // Resource -> API -> Feed -> Resource.
    // TODO: revisit see if there is a better structure that avoids this.
    // It is set within Feed.js
    this.feedCache = undefined;

    this.start = function(wsFactory) {
      this.open(wsFactory);
    }

    this.stop = function(restart) {
      throw("Not implemented");
    }

    this.restart = function() { this.stop(true); }

    this.open = function(wsFactory) {
      throw("Not implemented");
    }

    this.loadSample = function(key, value, map) {
      var time = parseFloat(key);
      if (value !== 0) value = parseFloat(value || "NaN");
      map.insert(time, value);
    }

    this.subscribeAll = function() {
      for (var feedId in this.feedCache.resources) {
        var feed = this.feedCache.resources[feedId];
        if (feed.samples.hasChangedObserver()) {
          this.subscribe(feed);
        }
      }
    }

    this.subscribe = function(feed) {
      throw("Not implemented");
    }
    
    this.unsubscribeAll = function(){
      for (var feedId in this.feedCache.resources) {
        var feed = this.feedCache.resources[feedId];
        if (feed.samples.hasChangedObserver()) {
          this.unsubscribe(feed);
        }
      }
    }

    this.unsubscribe = function(feed) {
      throw("Not implemented");
    }
    
    this._makeSampleResource = function(id, s, e) {
      return "feeds/" + id + "/samples?start=" + Math.floor(s) + "&end=" + Math.floor(e);
    }

    //
    // Ensure that the specified feed has all of the samples between start and
    // end, with minimum requests to the service.
    this.loadSamples = function(id, start, end, notify) {
      var feed = this.feedCache.get(id);
      var self = this;
      var parser = function(m, data) {
        var dataObj = JSON.parse(data);
        m.disableNotification();
        for (var key in dataObj.values) {
        self.loadSample(key, dataObj.values[key], m);
      }
        //all observers will be notified with the new data.
        m.enableNotification();
      };

      var loadTrailingSamples = function(sampleStore, start, end, notify) {
        if (end > feed.samples.lastTime) {
          var qStart = start;
          if (start < feed.samples.lastTime) {
             qStart = feed.samples.lastTime;
          }
          var resource = self._makeSampleResource(
            id, qStart, end);

          self.loadResource(resource, feed.samples, function(success) {
             notify && notify(success);
          }, parser);
        }
        else {
          notify && notify(true);
        }
      }

      //
      //load the leading samples
      if (isNaN(feed.samples.firstTime) || (start < feed.samples.firstTime)) {
        var qStart = start;

        var qEnd = feed.samples.firstTime;
        if (isNaN(feed.samples.firstTime) || (end <= feed.samples.firstTime)) {
          qEnd = end;
        }

        if (start < end) {
          var resource = this._makeSampleResource(id, qStart, qEnd);
          this.loadResource(resource, feed.samples, function(success) {
            if (success) {
              loadTrailingSamples(feed.samples, start, end, notify);
            }
            else {
              notify && notify(success);
            }
          }, parser);
        }
        else {
          loadTrailingSamples(feed.samples, start, end, notify);
        }
      }
      else {
        loadTrailingSamples(feed.samples, start, end, notify);
      }
    }
  }
  root.ili.ApiBase = ApiBase;
})(this);
