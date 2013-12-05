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
    KeepAliveAgent = ili.importPackage(root, 'KeepAliveAgent', 'keep-alive-agent'),
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
    this.agent = null;

    this._makeSampleResource = function(id, s, e){
       return "feeds/" + id + "/samples?start=" + Math.floor(s) + "&end=" + Math.floor(e);
    }
    //
    // Ensure that the specified feed has all of the samples between start and
    // end, with minimum requests to the service.
    this.loadSamples = function(id, start, end, notify) {
      var feed = api.feedCache.get(id);
      var self = this;
      var parser = function(m, data) {
        m.disableNotification();
        for (var key in data.values) {
        logger.info("loading sample k: " + key + " v: " + data.values[key]);
          self.loadSample(key, data.values[key], m);
        }
        //all observers will be notified with the new data.
        m.enableNotification();
      };

      var loadTrailingSamples = function(sampleStore, start, end, notify) {
        if (end > feed.samples.lastTime) {
          var qStart = start;
          if (start < feed.samples.lastTime) {
             qStart = feed.samples.lastTime;
          }
          var resource = self._makeSampleResource(
            id, qStart, end);

          self.loadResource(resource, feed.samples, function(success) {
             notify && notify(success);
          }, parser);
        }
        else {
          notify && notify(true);
        }
      }

      //
      //load the leading samples
      if (isNaN(feed.samples.firstTime) || (start < feed.samples.firstTime)) {
        var qStart = start;

        var qEnd = feed.samples.firstTime;
        if (isNaN(feed.samples.firstTime) || (end <= feed.samples.firstTime)) {
          qEnd = end;
        }

        if (start < end) {
          var resource = this._makeSampleResource(id, qStart, qEnd);
          this.loadResource(resource, feed.samples, function(success) {
            if (success) {
              loadTrailingSamples(feed.samples, start, end, notify);
            }
            else {
              notify && notify(success);
            }
          }, parser);
        }
        else {
          loadTrailingSamples(feed.samples, start, end, notify);
        }
      }
      else {
        loadTrailingSamples(feed.samples, start, end, notify);
      }
    }

    //
    // Loads the specified resource into the supplied map, notifying when done.
    // This function expects the resource to be an 'ObservableMap'
    this.loadResource = function(resource, map, notify, parser) {
      try {
          if (!this.agent) {
            this.agent =  new KeepAliveAgent.Secure({
              key : this.certs.key,
              cert: this.certs.cert,
              ca  : this.certs.ca });
          }
          
          var options = {
              host: this._host,
              port: this._port,
              path: '/api/v1/' + resource,
              agent: this.agent
          } 

          var uri = "https://" + options.host + ":" + options.port + options.path;
            
          logger.info("loading resources from " + uri);
          var data = "";

          var responseParser = parser || function(map, dataObj) {
             map.clear();
             map.disableNotification();
             for (var property in dataObj) {
                 if (dataObj.hasOwnProperty(property)) {
                     map.insert(property, dataObj[property]);
                 }
             }
             map.enableNotification();
          }

          var responseHandler = function(res) {
              logger.info("statusCode: ", res.statusCode);

              res.on('data', function(d) { data += d; });

              res.on('end', function() {
                  logger.info("data " + data);
                  var dataObj = null;
                  try {
                      dataObj = JSON.parse(data);
                      responseParser(map, dataObj);
                      notify && notify(true);
                  } catch (e) {
                      logger.error(e.toString());
                      notify && notify(false);
                  }    
              });

              res.on('error', function(e) {
                  logger.error(e.toString());
                  notify && notify(false);
              });
          }
          var req = https.get(options, responseHandler);
          req.on('error', function(e) {
              logger.error(e.toString());
              notify && notify(false);
          });
      }
      catch (e) {
          logger.error(e.toString());
          notify && notify(false);
      }
    }

    ///////////// WebSocket API ///
    this.heartBeatTimer = undefined;
    this.reconnectTimer = undefined;

    this.startHeartBeat = function() {
      var _self = this;
      this.heartBeatTimer && clearInterval(this.heartBeatTimer);
      //
      // Every 10 seconds send a heartbeat to the server telling it that we
      // are still here and interested in the feeds that we have subscribed to.
      this.heartBeatTimer = setInterval(function() {
        _self.send({'action' : 'heartbeat'});
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
      var _self = this;

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
        this.reconnectTimer = setTimeout(function(){ _self.open(); }, 10000);
      }
    }

    this.restart = function() { this.stop(true); }

    this.open = function(wsFactory) {
      logger.info("opening web socket");

      var _self = this;

      if (wsFactory){
        logger.info("overriding web socket");
        this.createWs = wsFactory;
      }

      this._ws = this.createWs(this.wsUri());


      this._ws.parent = this;


      this._ws.onmessage = function (msg) {
        try {
          logger.info("got message '" + msg.data + "'");
          var message = JSON.parse(msg.data);
          var feed = _self.feedCache.get(message.guid);

          feed.samples.disableNotification();
          for (var key in message.values)
          {
            _self.loadSample(key, message.values[key], feed.samples);
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

    this.subscribe = function(id, start) {
      return this.send({
        'action' : 'subscribe',
        'guid'   : id,
        'start'  : start
      });
    }

    this.unsubscribe = function(id) {
      return this.send({
        'action' : 'unsubscribe',
        'guid' : id});
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
  heir.inherit(Api, ApiBase);

  root.ili.Api = Api;
  root.ili.Api.instance = new Api();

})(this);
