/*
 * ObservableMap.js Copyright Percepscion Pty. Ltd.
 */

(function(root) {
  "use strict";

  var EventEmitter = ili_importPackage(root, 'EventEmitter', 'wolfy87-eventemitter'),
    logger = ili_import(root, 'Logger'),
    heir = ili_importPackage(root, 'heir', 'heir');

  //
  // The ObservableMap provides a wrapper for a map that allows peers to
  // be notified when the contents of the map changes. This code is based on
  // HashTable sourced from:
  //
  // http://www.mojavelinux.com/articles/javascript_hashes.html
  //
  // For this to be effective the user of the map must ensure they only ever
  // modify the map using the helper functions `insert` or `remove`, if the map
  // is modified outside of this then the observers will not be notified. If you
  // really must modify the map directly then you can call `changed()` to
  // force the change notification.
  function ObservableMap(obj) {
    this.length = 0;
    this.items = {};
    this.notify = true;
    this.hasChanged = false;

    for (var p in obj) {
      if (obj.hasOwnProperty(p)) {
        this.items[p] = obj[p];
        this.length++;
      }
    }
    
    this.inserted = {};
    this.removed = {};

    this.disableNotification = function(){
      this.notify = false;
    }

    this.enableNotification = function(){
      this.notify = true;
      if (this.hasChanged) {
        this.changed();
      }
    }

    this.changed = function() {
      this._values = null;
      this._keys = null;
      if (this.notify) {
        this.emit('changed', [this.inserted, this.removed]);
        this.hasChanged = false;
        this.inserted = {}
        this.removed = {}
      }
      else {
        this.hasChanged = true;
      }
    }

    this.insert = function(key, value) {
      var previous = undefined;
      if (this.has(key)) {
        previous = this.items[key];
      }
      else {
        this.length++;
      }
      this.items[key] = value;
      this.inserted[key] = value;
      this.afterInsert(key, value);
      this.changed();

      return previous;
    }

    this.get = function(key) {
      return this.has(key) ? this.items[key] : undefined;
    }

    this.has = function(key) {
      return this.items.hasOwnProperty(key);
    }

    this.remove = function(key) {
      var previous = undefined;
      if (this.has(key)) {
        previous = this.items[key];
        this.removed[key] = previous;
        this.length--;
        delete this.items[key];
        this.changed();
        return previous;
      }
      else {
        return undefined;
      }
    }

    var _keys = null;
    this.keys = function() {
      if (this._keys) {
        return this._keys;
      }
      _keys = [];
      for (var k in this.items) {
        if (this.has(k)) {
            _keys.push(k);
        }
      }
      return _keys;
    }

    var _values = null;
    this.values = function() {
      if (this._values) {
        return this._values;
      }
      _values = [];
      for (var k in this.items) {
        if (this.has(k)) {
            _values.push(this.items[k]);
        }
      }
      return _values;
    }

    this.each = function(fn) {
      for (var k in this.items) {
        if (this.has(k)) {
            fn(k, this.items[k]);
        }
      }
    }

    this.clear = function() {
      this.items = {}
      this.length = 0;
      this.changed();
    }

    this.hasChangedObserver = function(){
      var l = this.getListeners('changed');
      return l.length != 0;
    }
    
    this.afterChangedObserverRemoved = function() {}
    //TODO: Needs to be tested
    this.removeChangedObserver = function(l) {
        this.removeListener('changed', l)      
        this.afterChangedObserverRemoved();
    }

    //TODO: This needs to be tested
    this.afterChangedObserverAdded = function(first) {}
    this.addChangedObserver = function(listener){
      var first = !this.hasChangedObserver();
      this.on('changed', listener);
      this.afterChangedObserverAdded(first);
    }
    this.onchanged = this.addChangedObserver;

    //override this function if you want subclasses to do some extra work after
    //new values are inserted.
    this.afterInsert = function(key, value) { }
  }

  heir.inherit(ObservableMap, EventEmitter);

  root.ili_ObservableMap = ObservableMap;
  ili_ObservableMap = ObservableMap;
})(this);  
