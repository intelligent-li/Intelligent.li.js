/*
 * Feed.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
  "use strict";

  var EventEmitter = ili_importPackage(root, 'EventEmitter', 'wolfy87-eventemitter'),
    heir = ili_importPackage(root, 'heir', 'heir'),
    logger = ili_import(root, 'Logger'),
    api = ili_import(root, 'Api'),
    SampleStore = ili_import(root, 'SampleStore'),
    Resource = ili_import(root, 'Resource'),
    ResourceCache = ili_import(root, 'ResourceCache');

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

  root.ili_Feed = Feed;
  root.ili_FeedCache = new FeedCache();
  //register the feedCache instance with the API
  api.feedCache = root.ili_FeedCache;
  ili_Feed = Feed;
  ili_FeedCache = root.ili_FeedCache;   

})(this);
