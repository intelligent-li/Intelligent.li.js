/*
 * Feed.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
  "use strict";
  (typeof root.ili === 'undefined') && (root.ili = require('./Utils.js').ili);

  var ili = root.ili,
      EventEmitter = ili.importPackage(root, 'EventEmitter', 'wolfy87-eventemitter'),
      heir = ili.importPackage(root, 'heir', 'heir'),
      logger = ili.import(root, 'Logger').instance,
      api = ili.import(root, 'Api').instance,
      SampleStore = ili.import(root, 'SampleStore'),
      Resource = ili.import(root, 'Resource'),
      ResourceCache = ili.import(root, 'ResourceCache');

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

    this.samples.afterChangedObserverAdded = function(first, observer) {

      if (isNaN(self.samples.firstTime) || (self.start < self.samples.firstTime))
      {//the feed needs more data than we have
        var parser = function(map, data) {
           map.disableNotification();
           for (var key in data.values) {
               api.loadSample(key, data.values[key], self.samples);
           }
           //all observers will be notified with the new data.
           map.enableNotification();
        };
        var now = new Date().getTime() / 1000;
        var end = isNaN(self.samples.firstTime) ? now : self.samples.firstTime;
        var res = self.resource() + "/samples?start=" + self.start + "&end=" + end;
        api.loadResource(res, self.samples, function() {
          if (first) {
            api.subscribe(self.id, now);
          }
        }, parser);
      } else { //has enough data, notify then subscribe if we're the first
        //FIXME we're notifying more inserted items than might be expected.
        observer([self.samples.items, {}]);

        if (first) {
          api.subscribe(self.id, now);
        }
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

  root.ili.Feed = Feed;
  root.ili.feedCache = new FeedCache();
  root.ili.feeds = root.ili.feedCache;
  //register the feedCache instance with the API
  api.feedCache = root.ili.feedCache;
})(this);
