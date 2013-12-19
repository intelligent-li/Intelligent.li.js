/*
 * MeteorConnector.js Copyright Percepscion Pty. Ltd.
 */

(function(root) {
  "use strict";
  (typeof root.ili === 'undefined') && (root.ili = require('./Utils.js').ili);

  var ili = root.ili;
  var Future = Npm.require('fibers/future');
  var json2csv = Npm.require('json2csv');
  var fs = Npm.require('fs');
  var ObservableMap = ili.import(root, 'ObservableMap');
  var api = ili.import(root, 'Api').instance;
  var logger = ili.import(root, 'Logger').instance;

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
      _self._connections.find({last_seen: {$lt: (now - 60 * 1000)}}).forEach(function (connection) {
        logger.info("client " + connection._id + " has gone away");
        _self._removeClientSubscriptions(connection._id);
        _self._connections.remove({ _id: connection._id });
      });
    }, 10000);

    this.unsubscribe = function(guid, clientId) {
      _self._removeClientSubscription(clientId, guid);
    }

    //called remotely by clients when they want to subscribe to the value for a 
    //particular feed.
    this.subscribe = function(guid, clientId, start) {
      logger.info("client " + clientId + " is subscribing to feed " + guid + " from time " + start );
      
      var feed = api.feedCache.get(guid);
     
      if (typeof _self._clientObservers[clientId] === 'undefined') {
        _self._clientObservers[clientId] = {}
      }

      if (feed.id in _self._clientObservers[clientId]) {
        logger.info("this client is already subscribed to this feed");
        return;
      } 
      
      var observer = Meteor.bindEnvironment(function(samples) {
        _self._sampleStream.emit(feed.id, JSON.stringify(samples[0]));
      }, function (e) { logger.error('Failed to bind environment: ' + e.toString()); });

      _self._clientObservers[clientId][feed.id] = observer;
      
      feed.setStart(start);
      feed.samples.onchanged(observer);
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
        for (var id in this._clientObservers[clientId]){
          _self._removeClientSubscription(clientId, id);
        } 
        _self._clientObservers[clientId] = {}
      }
    }

    this.keepalive = function(clientId) {
      if (!_self._connections.findOne(clientId)) {
        _self._connections.insert({ _id: clientId});
      }    
      logger.info("got keepalive from " + clientId);
      _self._connections.update(clientId, {$set: {last_seen: (new Date()).getTime()}});
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

    //
    // Synchronously load resources from the server
    this.loadSamples = function(id, start, end) {
      var fut = new Future();

      api.loadSamples(id, start, end, function() {
        //FIXME: should filter out samples outside of start and end
        fut['return'](JSON.stringify(feed.samples.items));
      });

      return fut.wait();
    }


    this.downloader = function(ids, start, end) {
      var fut = new Future();
      logger.info("id : " + ids);
      logger.info("start : " + start);
      logger.info("end :" + end);
      var dataMap = new ObservableMap();
      var maxSampleFeedId;
      var maxSampleCount = 0;
      var maxSampleKeys = [];

      var gencsv = function(json) {
          var headings = []
          for(var i = 0; i < ids.length; i++) {
            headings.push(ili.sourceCache.get(ids[i]).tags.get("type"));
          }
          ids.push('increment')
          json2csv({data: json, fields: ids}, function(err, csv) {
            if (err) console.log(err);

            var fname = 'beip-' + Date.now() + '.csv';
            var fpath = '/var/tmp/' + fname;
            fs.writeFile(fpath, csv, function(err) {
                if (err) throw err;
                console.log('file saved' + fpath);
              });
            fut['return'](fname);
          });
      }


      var mapper = function() {
        if ( dataMap.keys().length == ids.length ) {

          var rows = [];
          for (var i = 0; i < maxSampleKeys.length; i++) {
            var aRow = {};
            var increment = maxSampleKeys[i];
            aRow['increment'] = increment;

            for (var c = 0; c < ids.length; c++ ){
              var id = ids[c];
              var feedValues = dataMap.get(id);
              aRow[id] = feedValues[increment] 
            }

            rows.push(aRow);
          }
          rows.reverse();

          logger.info("rows =" + JSON.stringify(rows) );
          gencsv(rows);

        }
      }


      ids.forEach(function(element, index, array){
        logger.info("downloading " + element);

        // FIXME: need to copy/slice the data into a new array based on start / end date
        api.feedCache.get(element).samples.clear();

        api.loadSamples(element, start, end, function() {
          //FIXME: should filter out samples outside of start and end
          var samples = api.feedCache.get(element).samples;
          if ( maxSampleCount < samples.length ) {
            maxSampleCount = samples.length;
            maxSampleFeedId = element
            maxSampleKeys = samples.keys();
          }

          logger.info("download data (" + samples.length 
                      + ") :" + JSON.stringify(samples.items));
          dataMap.insert(element, samples.items);
          mapper();
        });


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
    loadSamples: mc.loadSamples,
    downloader: mc.downloader,
    keepalive: mc.keepalive 
  });
});

