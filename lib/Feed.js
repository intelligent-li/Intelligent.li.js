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
    this._start = (new Date() / 1000) | 0;
    var self = this;

    this.samples.afterChangedObserverRemoved = function() {
      if (!self.samples.hasChangedObserver()) {
        api.unsubscribe(self);        
      }
    }

    this.samples.afterChangedObserverAdded = function(first, observer) {
      if (self.samples.length != 0) {
        observer([self.samples.items, {}]);
      }

      if (first) {
        var time = isNaN(self.samples.lastTime) ? Math.floor(new Date().getTime() / 1000) : self.samples.lastTime;
        api.subscribe(self.id, time);
      }
    }

    //
    // will load any extra data needed and notify all observers.
    this.setStart = function(s, notify) {
      self._start = Math.floor(s);
      if (isNaN(self.samples.firstTime) || (self._start < self.samples.firstTime)) {
        //the feed needs more data than we have
        var parser = function(map, data) {
           map.disableNotification();
           for (var key in data.values) {
               api.loadSample(key, data.values[key], self.samples);
           }
           //all observers will be notified with the new data.
           map.enableNotification();
        };
        var now = Math.floor(new Date().getTime() / 1000);
        var end = isNaN(self.samples.firstTime) ? now : self.samples.firstTime;
        var res = self.resource() + "/samples?start=" + self._start + "&end=" + end;
        api.loadResource(res, self.samples, notify, parser);
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
