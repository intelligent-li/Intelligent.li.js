/*
 * Api.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
  "use strict";
  (typeof root.ili === 'undefined') && (root.ili = require('./Utils.js').ili);

  var ili = root.ili,
    WebSocket = ili.importPackage(root, 'WebSocket', 'ws'),
    https = ili.importPackage(root, 'https', 'https'),
    heir = ili.importPackage(root, 'heir', 'heir'),
    logger = ili.import(root, 'Logger').instance,
    ApiBase = ili.import(root, 'ApiBase');

  //
  // Class that wraps up access to the the Intelligent.li API, including both
  // the RESTful interface and the websocket interface.
  function Api(host) {
    ApiBase.call(this, host);

    this._ws = undefined;
    
    this.wsUri = function() {
      return "wss://" + this._host + "/api/v1/live/feeds";
    }
   
    //
    // Loads the specified resource into the supplied map, notifying when done.
    // This function expects the resource to be an 'ObservableMap'
    this.loadResource = function(resource, map, notify) {
      try {
          var options = {
              host: this._host,
              port: this._port,
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
          req.on('error', function(e) {
              logger.error(e.toString());
              notify(false);
          });
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

      if (this._ws.readyState == WebSocket.OPEN) {
         this.unsubscribeAll();
      }
      this._ws.close();
      this._ws = null;

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
      } else {
        this.createWs = wsFactory;
      }

      this._ws = wsFactory(this.wsUri());
      this._ws.parent = this;

      this._ws.onmessage = function (msg) {
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

      this._ws.onopen = function() {
        logger.info("web socket has opened");
        this.parent.startHeartBeat();
        this.parent.subscribeAll();
      };

      this._ws.onclose = function(evt) {
        logger.info("socket close occurred " + evt.reason);
        this.parent.restart();
      };

      this._ws.onerror = function(err)
      {
        logger.error("socket error occurred " + err);
        this.parent.restart();
      }
    }

    this.subscribe = function(feed) {
      return this.send({
        'action' : 'subscribe',
        'guid'   : feed.id,
        'start'  : feed.start
      });
    }

    this.unsubscribe = function(feed) {
      return this.send({
        'action' : 'unsubscribe',
        'guid' : feed.id});
    }

    this.send = function(obj) {
      if ((this._ws) && (this._ws.readyState == WebSocket.OPEN)) {
        var message = JSON.stringify(obj);
        logger.info('sending: ' + message);
        this._ws.send(message);
      }
      else {
        logger.info('not currently connected');
        return false;
      }
      return true;
    }
  }
  heir.inherit(Api, ili.ApiBase);

  root.ili.Api = Api;
  root.ili.Api.instance = new Api();

})(this);
