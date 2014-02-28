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

    this.loadBlob = function(collection, sensor, index, alignment) {
      var fut = new Future();
      api.loadBlob(collection, sensor, index, alignment, function(success, d) {
        fut['return'](JSON.stringify(d.items));
      });
      return fut.wait();
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

    this._getTempFile = function(fb) {
      var fname = fb;
      var fpath = '/var/tmp/ili';
      try {
        fs.mkdirSync(fpath);
      } catch (e) {}

      fpath += "/" + fname;
      return fpath;
    }

    this.blobDownloader = function(id, start, end, ext, fb, name) {
      var fut = new Future();
      var fname = fb + '-' + (new Date().getTime()) + '.zip';
      var fullFileName = _self._getTempFile(fname);
      var buf = '';
      var chunk = 0;

      var dataHandler = function(d) {
        buf += d;
        if (chunk++ > 128) {
          fs.appendFileSync(fullFileName, buf, 'binary');
          buf = '';
          chunk = 0;
        }
      }

      api.loadBlobs(id, start, end, ext, name, dataHandler, function(success, msg) {
        fs.appendFileSync(fullFileName, buf, 'binary');
        fut['return'](fname);
      });
      return fut.wait();
    }

    this.downloader = function(ids, start, end, fb) {
      var fut = new Future();
      logger.info("id : " + ids);
      logger.info("start : " + start);
      logger.info("end :" + end);
      var dataMap = new ObservableMap();
      var maxSampleFeedId;
      var maxSampleCount = 0;
      var maxSampleKeys = [];
      var csvFields = ['time'];
      for (var f = 0; f < ids.length; f++ ){
        csvFields.push(ids[f]['type']);
      }

      var gencsv = function(json) {
        json2csv({data: json, fields: csvFields}, function(err, csv) {
          if (err) console.log(err);
          var fname = fb + Date.now() + '.csv';
          fs.writeFile(_self._getTempFile(fname), csv, function(err) {
            if (err) throw err;
            logger.debug('file saved ' + fname);
            fut['return'](fname);
          });
        });
      }

      var mapper = function() {
        if ( dataMap.keys().length == ids.length ) {
          var rows = [];
          for (var i = 0; i < maxSampleKeys.length; i++) {
            var aRow = {};
            var time = maxSampleKeys[i];
            aRow['time'] = time;

            for (var c = 0; c < ids.length; c++ ){
              var id = ids[c]['id'];
              var type = ids[c]['type'];
              var feedValues = dataMap.get(type);

              if ((typeof feedValues != 'undefined') && (time in feedValues)) {
                aRow[type] = feedValues[time];
              } else {
                aRow[type] = "NaN";
              }
            }

            rows.push(aRow);
          }
          //rows.reverse();
          gencsv(rows);
        }
      }

      ids.forEach(function(feed, index, array) {
        var fid = feed['id'];

        logger.info("downloading samples for feed " + fid);

        // FIXME: need to copy/slice the data into a new array based on start / end date
        api.feedCache.get(fid).samples.clear();

        api.loadSamples(fid, start, end, function() {
          //FIXME: should filter out samples outside of start and end
          var samples = api.feedCache.get(fid).samples;
          if ( maxSampleCount < samples.length ) {
            maxSampleCount = samples.length;
            maxSampleFeedId = fid;
            maxSampleKeys = samples.keys();
          }

          logger.info("downloaded " + samples.length + " samples for feed " + fid); 
          dataMap.insert(feed['type'], samples.items);
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
    loadBlob: mc.loadBlob,
    loadResource: mc.loadResource,
    loadSamples: mc.loadSamples,
    downloader: mc.downloader,
    blobDownloader: mc.blobDownloader,
    keepalive: mc.keepalive 
  });
});

