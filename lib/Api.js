/*
 * Api.js Copyright Percepscion Pty. Ltd.
 */
var $ = require('jQuery'),
    logger = require('./Logger.js').logger,
    WebSocket = require('ws');

(function(exports) {
  "use strict";
  //
  // Class that wraps up access to the the Intelligent.li API, including both
  // the RESTful interface and the websocket interface.
  function Api(host) {
    this.host = host || "au.intelligent.li";
    this.ws = undefined;

    this.httpUri = function() {
      return "https://" + this.host;
    }

    this.wsUri = function() {
      return "wss://" + this.host + "/api/v1/live/feeds";
    }

    //
    // Loads the specified resource into the supplied map, notifying when done.
    // This function expects the resource to be an 'ObservableMap`
    this.loadResource = function(resource, map, notify) {
      var url = this.httpUri() + "/api/v1/" + resource;
      logger.info("loading resource from " + url);
      $.getJSON(url, function(data, result) {
        logger.info("got response result: " + result + ", data: " + data);
        if (result == "success") {
          map.clear();
          map.disableNotification();
          for (var property in data) {
            if (data.hasOwnProperty(property)) {
              map.insert(property, data[property]);
            }
          }
          map.enableNotification();
        }
        notify(result == "success");
     });
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
      logger.info("new websocket for " + this.wsUri());
      return new WebSocket(this.wsUri());
    }

    //
    // Connects to the intelligent.li websocket server using the supplied
    // WebSocket options. Once connected the api will maintain
    // subscriptions, connection, heartbeats etc. internally.
    this.start = function() {
      this.open();
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

    this.open = function() {
      logger.info("opening web socket");

      var self = this;

      this.ws = this.createWs(this.wsUri());
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

  exports.instance = new Api();
  exports.Api = Api;
})(this);