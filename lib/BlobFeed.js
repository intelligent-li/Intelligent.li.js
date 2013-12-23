(function(root) {
  "use strict";
  (typeof root.ili === 'undefined') && (root.ili = require('./Utils.js').ili);

  var ili = root.ili,
      EventEmitter = ili.importPackage(root, 'EventEmitter', 'wolfy87-eventemitter'),
      heir = ili.importPackage(root, 'heir', 'heir'),
      logger = ili.import(root, 'Logger').instance,
      api = ili.import(root, 'Api').instance,
      Feed = ili.import(root, 'Feed');

  function BlobFeed(id, a) {
    Feed.call(this, id);
    var _self = this;
    this._alignment = a;
    this.samples = undefined;

    this._index = function(time){
      var t = time || (new Date().getTime() / 1000)
      return Number((t / this._alignment).toFixed(0));
    }

    //
    //loads the latest blob based on the
    //alignment and now
    this.latest = function(notify) {
      var s = ili.sources.get(this.id);
      s.loadAttributes(function() {
        var collection = s.attributes.get("collection");
        var sensor = s.attributes.get("sensor");

        api.loadBlob(
          collection, sensor, _self._index(), _self._alignment, notify);
      });
    }
  }

  heir.inherit(BlobFeed, Feed);

  root.ili.BlobFeed = BlobFeed;

})(this);
