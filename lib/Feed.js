/*
 * Feed.js Copyright Percepscion Pty. Ltd.
 */
"use strict";

if (typeof Meteor === 'undefined') {
  var logger = require('./Logger.js'),
    EventEmitter = require('wolfy87-eventemitter'),
    api = require('./Api.js').instance,
    heir = require('heir'),
    SampleStore = require('./SampleStore.js').SampleStore,
    Resource = require('./Resource.js').Resource,
    ResourceCache = require('./ResourceCache.js').ResourceCache;
} else {
    var logger = ili_logger;    
    EventEmitter = Npm.require('wolfy87-eventemitter'),
    heir = Npm.require('heir'),
    api = ili_api,
    SampleStore = ili_SampleStore,
    Resource = ili_Resource,
    ResourceCache = ili_ResourceCache;
}
  
  //
  // Provides a class that represents an Intelligent.li Feed.
  function Feed(id) {
    Resource.call(this, "feeds", id);
    this.samples = new SampleStore();
    this.start = (new Date() / 1000) | 0;
    var self = this;
    this.samples.afterChangedObserverRemoved = function() {
      if (!self.samples.hasChangedObserver()) {
        api.unsubscribe(self);        
      }
    }
    this.samples.afterChangedObserverAdded = function(first) {
      if (first) {
        api.subscribe(self);
      }
    }
  }
  heir.inherit(Feed, Resource);

  //
  // Provides a cache for Intelligent.li feeds
  function FeedCache() {
    ResourceCache.call(this, "feeds");
    this.create = function(id) {
      return new Feed(id);
    }
  }
  heir.inherit(FeedCache, ResourceCache);

  if (typeof Meteor === 'undefined') {
    exports.Feed = Feed;
    exports.feedCache = new FeedCache();
    //register the feedCache instance with the API
    api.feedCache = exports.feedCache;
  } else {
    ili_Feed = Feed;
    ili_feedCache = new FeedCache();   
    //register the feedCache instance with the API
    api.feedCache = ili_feedCache;
  }
