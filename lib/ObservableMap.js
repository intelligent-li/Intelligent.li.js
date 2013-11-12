/*
 * ObservableMap.js Copyright Percepscion Pty. Ltd.
 */
var logger = require('../lib/Logger.js'),
    EventEmitter = require('wolfy87-eventemitter'),
    heir = require('heir');

(function(exports) {
  "use strict";

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
      this.values = null;
      this.keys = null;
      if (this.notify) {
        this.emit('changed');
        this.hasChanged = false;
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
        this.length--;
        delete this.items[key];
        this.changed();
        return previous;
      }
      else {
        return undefined;
      }
    }

    var keys = null;
    this.keys = function() {
      if (this.keys) {
        return this.keys;
      }
      keys = [];
      for (var k in this.items) {
        if (this.has(k)) {
            keys.push(k);
        }
      }
      return keys;
    }

    var values = null;
    this.values = function() {
      if (this.values) {
        return this.values;
      }
      values = [];
      for (var k in this.items) {
        if (this.has(k)) {
            values.push(this.items[k]);
        }
      }
      return values;
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
    this.addChangedObserver = function(listener){
      this.on('changed', listener);
    }
    this.onchanged = this.addChangedObserver;

    //override this function if you want subclasses to do some extra work after
    //new values are inserted.
    this.afterInsert = function(key, value) { }

  }
  heir.inherit(ObservableMap, EventEmitter);


  exports.ObservableMap = ObservableMap;

})(this);