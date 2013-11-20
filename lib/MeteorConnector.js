/*
 * MeteorConnector.js Copyright Percepscion Pty. Ltd.
 */

(function(root) {
  "use strict";
  var Future = Npm.require('fibers/future');
  var ObservableMap = ili_import(root, 'ObservableMap');
  var api = ili_import(root, 'Api').instance;
  var logger = ili_import(root, 'Logger').instance;

  //
  // Class intended to run on a meteor server that provides a connector for the
  // ApiMetoerClient to access Intelligent.li. Uses a combination of Meteor.call
  // and Meteor streams to interact with the client.
  function MeteorConnector() {
    this._connections = new root.Meteor.Collection("connections");
    this._sampleStream = new root.Meteor.Stream('ili.samples');
    //feed.stream.permissions.write(function(eventName) { return false; });
    //feed.stream.permissions.read(function(eventName) { return true; });

    //maintains the feed that each client is currently subscribed to.
    this._clientObservers = {};
    var _self = this;

    // clean up missing clients after 60 seconds
    Meteor.setInterval(function () {
      var now = (new Date()).getTime();
      _self.connections.find({last_seen: {$lt: (now - 60 * 1000)}}).forEach(function (connection) {
        logger.info("client " + connection._id + " has gone away");
        _self.removeClientSubscriptions(connection._id);
        _self.connections.remove({ _id: connection._id });
      });
    }, 10000);

    this.unsubscribe = function(guid, clientId) {
      _self.removeClientSubscription(clientId, guid);
    }

    //called remotely by clients when they want to subscribe to the value for a 
    //particular feed.
    this.subscribe = function(guid, clientId) {
      logger.info("subscribing to: " + guid);
      
      var feed = api.feedCache.get(guid);
     
      if (typeof _self._clientObservers[clientId] === 'undefined') {
        _self._clientObservers[clientId] = {}
      }

      if (feed.id in _self._clientObservers[clientId]) {
        logger.info("this client is already subscribed to this feed");
        return;
      } 
      
      var observer = Meteor.bindEnvironment(function(samples) {
        logger.info("got samples for feed " + JSON.stringify(samples[0]));
        _self.sampleStream.emit(feed.id, JSON.stringify(samples[0]));
      }, function (e) { logger.error('Failed to bind environment: ' + e.toString()); });

      _self._clientObservers[clientId][feed.id] = observer;
      feed.loadAttributes(function() {
        var ls = feed.attributes.get('lastSample');
        var interval = feed.attributes.get('interval');
        if (ls && interval) feed.start = ls - interval;

        feed.samples.onchanged(observer);
      });
    }

     this._removeClientSubscription = function(clientId, feedId){
      if (typeof _self._clientObservers[clientId] === 'undefined') {
      } else {
        if (feedId in _self._clientObservers[clientId]) {
          var f = api.feedCache.get(feedId);
          f.samples.removeChangedObserver(
            _self._clientObservers[clientId][feedId]);
        }
      }
    }

     this._removeClientSubscriptions = function(clientId) {
      if (typeof _self._clientObservers[clientId] === 'undefined') {
        _self._clientObservers[clientId] = {}
      } else {
        for (id in this._clientObservers[clientId]){
          _self.removeClientSubscription(clientId, id);
        } 
        _self._clientObservers[clientId] = {}
      }
    }

    this.keepalive = function(clientId) {
      if (!_self.connections.findOne(clientId)) {
        _self.connections.insert({ _id: clientId});
      }    
      logger.info("got keepalive from " + clientId);
      _self.connections.update(clientId, {$set: {last_seen: (new Date()).getTime()}});
    }

       //
    // Synchronously load resources from the server
    this.loadResource = function(resource) {
      var fut = new Future();
      var map = new ObservableMap();

      api.loadResource(resource, map, function(){
        fut['return'](JSON.stringify(map.items));
      });

      return fut.wait();
    }
  }
  root.MeteorConnector = MeteorConnector;

})(this);

Meteor.startup(function () {
  MeteorConnector.instance = new MeteorConnector();
  var mc = MeteorConnector.instance;
  Meteor.methods({
    subscribe: mc.subscribe,
    unsubscribe: mc.unsubscribe,
    loadResource: mc.loadResource,
    keepalive: mc.keepalive 
  });
});

