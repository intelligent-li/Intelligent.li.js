/*
 * Api.js Copyright Percepscion Pty. Ltd.
 */
"use strict";

  if (typeof Meteor === 'undefined') {
    var $ = require('jQuery'),
      logger = require('./Logger.js').logger,
      WebSocket = require('ws');
      https = require('https');
  } else {
    var WebSocket = Npm.require('ws');
    var logger = ili_logger;
    var https = Npm.require('https');
  }

  //
  // Class that wraps up access to the the Intelligent.li API, including both
  // the RESTful interface and the websocket interface.
  function Api(host) {
    this.host = host || "au.intelligent.li";
    this.port = 443;
    this.ws = undefined;
    
    this.wsUri = function() {
      return "wss://" + this.host + "/api/v1/live/feeds";
    }
    
    this.certs = {};

    //
    // Loads the specified resource into the supplied map, notifying when done.
    // This function expects the resource to be an 'ObservableMap'
    this.loadResource = function(resource, map, notify) {
      try {
          var options = {
              host: this.host,
              port: this.port,
              path: '/api/v1/' + resource,
              agent: false
          } 
          options.key=this.certs.key;
          options.cert=this.certs.cert;
          options.ca=this.certs.ca;
            
          var uri = "https://" + options.host + ":" + options.port + options.path;
            
          logger.info("loading resources from " + uri);
          var data = "";

          var responseHandler = function(res) {
              logger.info("statusCode: ", res.statusCode);

              res.on('data', function(d) { data += d; });

              res.on('end', function() {
                  logger.info("data " + data);
                  var dataObj = null;
                  try {
                      dataObj = JSON.parse(data);
                      map.clear();
                      map.disableNotification();
                      for (var property in dataObj) {
                          if (dataObj.hasOwnProperty(property)) {
                              map.insert(property, dataObj[property]);
                          }
                      }
                      map.enableNotification();
                      notify(true);
                  } catch (e) {
                      logger.error(e.toString());
                      notify(false);
                  }    
              });

              res.on('error', function(e) {
                  logger.error(e.toString());
                  notify(false);
              });
          }
          var req = https.get(options, responseHandler);
      }
      catch (e) {
          logger.error(e.toString());
          notify(false);
      }
    }

    ///////////// WebSocket API ///
    this.heartBeatTimer = undefined;
    this.reconnectTimer = undefined;

    this.startHeartBeat = function() {
      var self = this;
      this.heartBeatTimer && clearInterval(this.heartBeatTimer);
      //
      // Every 10 seconds send a heartbeat to the server telling it that we
      // are still here and interested in the feeds that we have subscribed to.
      this.heartBeatTimer = setInterval(function() {
        logger.info("sending heartbeat");
        self.send({'action' : 'heartbeat'});
      }, 10000);
    }

    // this is used to avoid circular dependencies with
    // Resource -> API -> Feed -> Resource.
    // TODO: revisit see if there is a better structure that avoids this.
    // It is set within Feed.js
    this.feedCache = undefined;

    //
    // Override this function change the way the web socket is created, i.e.
    // if you want to add new options, or change the WebSocket implementation
    // that is used.
    this.createWs = function(url) {
      logger.info("new websocket for " + url);
      return new WebSocket(url, this.certs);
    }

    //
    // Connects to the intelligent.li websocket server using the supplied
    // WebSocket options. Once connected the api will maintain
    // subscriptions, connection, heartbeats etc. internally.
    this.start = function(wsFactory) {
      this.open(wsFactory);
    }

    this.stop = function(restart) {
      var self = this;

      logger.info("closing websocket");
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = undefined;
      clearInterval(this.heartBeatTimer);
      this.heartBeatTimer = undefined;

      if (this.ws.readyState == WebSocket.OPEN) {
         this.unsubscribeAll();
      }
      this.ws.close();
      this.ws = null;

      if (restart) {
        //setup to re-connect in a few seconds.
        this.reconnectTimer = setTimeout(function(){ self.open(); }, 10000);
      }
    }

    this.restart = function() { this.stop(true); }

    this.open = function(wsFactory) {
      logger.info("opening web socket");

      var self = this;
      if (!wsFactory){
        wsFactory = this.createWs;
      }

      this.ws = wsFactory(this.wsUri());
      this.ws.parent = this;

      this.ws.onmessage = function (msg) {
        try {
          logger.info("got message '" + msg.data + "'");
          var message = JSON.parse(msg.data);
          var feed = self.feedCache.get(message.guid);

          feed.samples.disableNotification();
          for (var key in message.values)
          {
              var time = parseFloat(key);
              var value = message.values[key];
              value = parseFloat(value || "NaN");

              feed.samples.insert(time, value);
          }
          feed.samples.enableNotification();
        }
        catch (e) {
          logger.error("error handling web socket message " + e);
        }
      };

      this.ws.onopen = function() {
        logger.info("web socket has opened");
        this.parent.startHeartBeat();
        this.parent.subscribeAll();
      };

      this.ws.onclose = function(evt) {
        logger.info("socket close occurred " + evt.reason);
        this.parent.restart();
      };

      this.ws.onerror = function(err)
      {
        logger.error("socket error occurred " + err.data);
        this.parent.restart();
      }
    }

    this.subscribeAll = function() {
      for (var feedId in this.feedCache.resources) {
        var feed = this.feedCache.resources[feedId];
        if (feed.samples.hasChangedObserver()) {
          this.subscribe(feed);
        }
      }
    }

    this.subscribe = function(feed) {
      return this.send({
        'action' : 'subscribe',
        'guid'   : feed.id,
        'start'  : feed.start
      });
    }
    
    this.unsubscribeAll = function(){
      for (var feedId in this.feedCache.resources) {
        var feed = this.feedCache.resources[feedId];
        if (feed.samples.hasChangedObserver()) {
          this.unsubscribe(feed);
        }
      }
    }

    this.unsubscribe = function(feed) {
      return this.send({
        'action' : 'unsubscribe',
        'guid' : feed.id});
    }

    this.send = function(obj) {
      if ((this.ws) && (this.ws.readyState == WebSocket.OPEN)) {
        var message = JSON.stringify(obj);
        logger.info('sending: ' + message);
        this.ws.send(message);
      }
      else {
        logger.info('not currently connected');
        return false;
      }
      return true;
    }
  }
    
  if (typeof Meteor === 'undefined') {
    exports.instance = new Api();
    exports.Api = Api;
  } else {
    console.log("Exporting intelligentli api");
    ili_api = new Api();
  }
