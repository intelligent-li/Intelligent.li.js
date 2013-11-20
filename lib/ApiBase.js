/*
 * ApiBase.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
  "use strict";
   (typeof root.ili === 'undefined') && (root.ili = require('./Utils.js').ili);

  var ili = root.ili,
      logger = root.ili.import(root, 'Logger').instance;

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
  }
  root.ili.ApiBase = ApiBase;
})(this);
