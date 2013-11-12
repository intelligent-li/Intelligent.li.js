/*
 * SampleStore.js Copyright Percepscion Pty. Ltd.
 *
 * Provides a class that caches the samples for a Feed.
 */
var logger = require('../lib/Logger.js'),
    EventEmitter = require('wolfy87-eventemitter').EventEmitter,
    ObservableMap = require('./ObservableMap.js').ObservableMap,
    heir = require('heir');

(function(exports) {
  "use strict";

  function SampleStore() {
    ObservableMap.call(this, {});

    //this.start = ((new Date() / 1000) | 0) - seconds;
    this.lastValue = Number.NaN;
    this.lastTime = 0;
    this.firstValue = Number.NaN;
    this.firstTime = Number.NaN;
    this.max = Number.NaN;
    this.min = Number.NaN;

    //called after a new sample is inserted.
    this.afterInsert = function(time, value) {
      if (time >= this.lastTime) {
        this.lastTime = time;
        this.lastValue = value;
      }

      if (isNaN(this.firstTime) || (time <= this.firstTime)) {
        this.firstTime = time;
        this.firstValue = value;
      }

      if (isNaN(this.max) || (value > this.max)) { this.max = value; }
      if (isNaN(this.min) || (value < this.min)) { this.min = value; }
    }
  }
  heir.inherit(SampleStore, ObservableMap);
  exports.SampleStore = SampleStore;

})(this);