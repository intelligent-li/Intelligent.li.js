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
    this._start = (new Date().getTime() / 1000) | 0;
    var _self = this;

    this.samples.afterChangedObserverRemoved = function() {
      if (!_self.samples.hasChangedObserver()) {
        api.unsubscribe(_self);        
      }
    }

    this.samples.afterChangedObserverAdded = function(first, observer) {
      if (_self.samples.length != 0) {
        observer([_self.samples.items, {}]);
      }

      if (first) {
        var time = _self._start;
        if (!isNaN(_self.samples.lastTime) && (time < _self.samples.lastTime)){
          time = _self.samples.lastTime;
        }
        api.subscribe(_self.id, time);
      }
    }

    //
    // will load any extra data needed and notify all observers.
    this.setStart = function(s, notify) {
      _self._start = Math.floor(s);
      var now = Math.floor(new Date().getTime() / 1000);
      var end = isNaN(_self.samples.firstTime) ? now : _self.samples.firstTime;
      api.loadSamples(this.id, this._start, end, notify);
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
