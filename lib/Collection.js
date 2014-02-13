/*
 * Collection.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
  "use strict";
  (typeof root.ili === 'undefined') && (root.ili = require('./Utils.js').ili);

  var ili = root.ili,
      EventEmitter = ili.importPackage(root, 'EventEmitter', 'wolfy87-eventemitter'),
      heir = ili.importPackage(root, 'heir', 'heir'),
      logger = ili.import(root, 'Logger').instance,
      Resource = ili.import(root, 'Resource'),
      ResourceCache = ili.import(root, 'ResourceCache'),
      ObservableMap = ili.import(root, 'ObservableMap'),
      feeds = require('../lib/Feed.js').ili.feeds,
      sources = require('../lib/Source.js').ili.sources,
      api = require('../lib/Api.js').ili.Api.instance;

  //
  // Provides a class that represents an Intelligent.li Collection.
  function Collection(id) {
    Resource.call(this, "collections", id);
    var _self = this;

    this._loadChildTags = function(allTags, cache) {
      var ids = allTags.get(cache.type);
      for (var id in ids) {
        var r = cache.get(id);
        r.tags = new ObservableMap();
        r.tags.disableNotification();
        var tags = ids[id];
        for (var name in tags) {
           r.tags.insert(name, tags[name]);
        }
        r.tags.enableNotification();
        r.tags.tagsLoaded = new Date();
      }
    }
    //override the loadTags to include a 'recursive=true' so we load our child
    //feed and source tags too

    this.loadTags = function(notify) {
      if (!this.tagsLoaded) {
        logger.info("loading recursive tags for resource " + this.resource());
        var allTags = new ObservableMap();
        api.loadResource(this.resource() + "/tags?recursive=true", allTags, function(result) {
          var ctags = allTags.get("collection");
          //load collection tags
          _self.tags = new ObservableMap();
          _self.tags.disableNotification();
          for (var name in ctags) {
             _self.tags.insert(name, ctags[name]);
          }
          _self.tags.enableNotification();

          //load sources tags
          _self._loadChildTags(allTags, sources)
          _self._loadChildTags(allTags, feeds)

          _self.tags.tagsLoaded = new Date();
          notify && notify(true);
        });
      } else {
        notify && notify(true);
      }
    }
  }
  heir.inherit(Collection, Resource);

  //
  // Provides a cache for Intelligent.li Devices
  function CollectionCache() {
    ResourceCache.call(this, "collections");
    this.create = function(id){
      return new Collection(id);
    }
  }
  heir.inherit(CollectionCache, ResourceCache);

  root.ili.Collection = Collection;
  root.ili.collectionCache = new CollectionCache();
  root.ili.collections = root.ili.collectionCache;
})(this);    

