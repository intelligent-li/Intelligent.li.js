/*
 * Feed.js Copyright Percepscion Pty. Ltd.
 */
var logger = require('./Logger.js'),
    EventEmitter = require('wolfy87-eventemitter'),
    api = require('./Api.js').instance,
    heir = require('heir'),
    SampleStore = require('./SampleStore.js').SampleStore,
    Resource = require('./Resource.js').Resource,
    ResourceCache = require('./ResourceCache.js').ResourceCache;

(function(exports) {
  "use strict";
  //
  // Provides a class that represents an Intelligent.li Feed.
  function Feed(id) {
    Resource.call(this, "feeds", id);
    this.samples = new SampleStore();
    this.start = (new Date() / 1000) | 0;
  }
  heir.inherit(Feed, Resource);
  exports.Feed = Feed;

  //
  // Provides a cache for Intelligent.li feeds
  function FeedCache() {
    ResourceCache.call(this);
    this.create = function(id) {
      return new Feed(id);
    }
  }
  heir.inherit(FeedCache, ResourceCache);
  exports.feedCache = new FeedCache();

  //register the feedCache instance with the API
  api.feedCache = exports.feedCache;

})(this);