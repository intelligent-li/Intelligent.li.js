//
// Sample Intelligent.li application that using Meteor
// 
// Currently this only provides the latest value for the 
// feed to the client, which means it doesn't support charts etc.
// this is something we'll improve in time. 

(function(root) {
  "use strict";
  var Future = Npm.require('fibers/future');
  var ObservableMap = ili_import(root, 'ObservableMap');
  var api = ili_import(root, 'Api');
  var logger = ili_import(root, 'Logger');

  function MeteorConnector() {
    this.connections = new root.Meteor.Collection("connections");
    this.sampleStream = new root.Meteor.Stream('ili.samples');
    //feed.stream.permissions.write(function(eventName) { return false; });
    //feed.stream.permissions.read(function(eventName) { return true; });

    //maintains the feed that each client is currently subscribed to.
    this.clientObservers = {};
    var self = this;

    this.methods = {
      subscribe: self.subscribe, 
      unsubscribe: self.unsubscribe, 
      loadResource: self.loadResource,
      keepalive: self.keepalive
    };

    // clean up missing clients after 60 seconds
    Meteor.setInterval(function () {
      var now = (new Date()).getTime();
      self.connections.find({last_seen: {$lt: (now - 60 * 1000)}}).forEach(function (connection) {
        logger.info("client " + connection._id + " has gone away");
        self.removeClientSubscriptions(connection._id);
        self.connections.remove({ _id: connection._id });
      });
    }, 10000);

    this.unsubscribe = function(guid, clientId) {
      self.removeClientSubscription(clientId, guid);
    }

    //called remotely by clients when they want to subscribe to the value for a 
    //particular feed.
    this.subscribe = function(guid, clientId) {
      logger.info("subscribing to: " + guid);
      
      var feed = api.feedCache.get(guid);
     
      if (typeof self.clientObservers[clientId] === 'undefined') {
        self.clientObservers[clientId] = {}
      }

      if (feed.id in self.clientObservers[clientId]) {
        logger.info("this client is already subscribed to this feed");
        return;
      } 
      
      var observer = Meteor.bindEnvironment(function(samples) {
        logger.info("got samples for feed " + JSON.stringify(samples[0]));
        self.sampleStream.emit(feed.id, JSON.stringify(samples[0]));
      }, function (e) { logger.error('Failed to bind environment: ' + e.toString()); });

      self.clientObservers[clientId][feed.id] = observer;
      feed.loadAttributes(function() {
        var ls = feed.attributes.get('lastSample');
        var interval = feed.attributes.get('interval');
        if (ls && interval) feed.start = ls - interval;

        feed.samples.onchanged(observer);
      });
    }

    this.removeClientSubscription = function(clientId, feedId){
      if (typeof self.clientObservers[clientId] === 'undefined') {
      } else {
        if (feedId in self.clientObservers[clientId]) {
          var f = api.feedCache.get(feedId);
          f.samples.removeChangedObserver(self.clientObservers[clientId][feedId]);
        }
      }
    }

    this.removeClientSubscriptions = function(clientId) {
      if (typeof self.clientObservers[clientId] === 'undefined') {
        self.clientObservers[clientId] = {}
      } else {
        for (id in this.clientObservers[clientId]){
          self.removeClientSubscription(clientId, id);
        } 
        self.clientObservers[clientId] = {}
      }
    }

    this.keepalive = function(clientId) {
      if (!self.connections.findOne(clientId)) {
        self.connections.insert({ _id: clientId});
      }    
      logger.info("got keepalive from " + clientId);
      self.connections.update(clientId, {$set: {last_seen: (new Date()).getTime()}});
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

