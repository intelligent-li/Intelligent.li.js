var expect = require('chai').expect,
    Api = require('../lib/Api.js').Api,
    logger = require('../lib/logger.js').logger,
    api = require('../lib/Api.js').instance,
    feedCache = require('../lib/Feed.js').feedCache,
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    $ = require('jQuery'),
    ObservableMap = require('../lib/ObservableMap.js').ObservableMap,
    SampleStore = require('../lib/SampleStore.js').SampleStore,
    spyLogger = require('winston-spy'),
    winston = require('winston'),
    WebSocket = require('ws'),
    nock = require('nock');

describe("Api", function() {
  describe("constructor", function() {
    it("should default to use production", function() {
      expect(api.host).to.equal("au.intelligent.li");
    });

    it("should allow the host to be specified", function() {
      var a = new Api("a different host");
      expect(a.host).to.equal("a different host");
    });

    it("should have a singleton instance that uses the default host", function() {
      expect(api).to.be.defined;
      expect(api.host).to.equal("au.intelligent.li");
    });
  });

  describe("#loadResource", function(done) {
    afterEach(function(){ });

    it("should fill in the map with the response from the server", function(done) {
      var map = new ObservableMap();

      var feedNock = nock('https://au.intelligent.li')
        .get('/api/v1/feeds/feed-1')
        .reply(200, { name1: "value1", name2 : { name3: "value3" }});

      api.loadResource("feeds/feed-1", map, function(success) {
        expect(success).to.be.true;
        expect(map.items).to.have.keys(['name1', 'name2']);
        expect(map.items.name1).to.equal("value1");
        expect(map.items.name2.name3).to.equal("value3");
        done();
      });
    });

    it("should detect call failures", function(done) {
      var map = new ObservableMap();

     var feedNock = nock('https://au.intelligent.li')
        .get('/api/v1/feeds/feed-1')
        .reply(404, { "ERROR": "Resource not found" });

      api.loadResource("feeds/feed-1", map, function(success) {
        expect(success).to.be.false;
        done();
      });
    });
  });

  describe("websockets", function() {
    var createWsSpy;
    var oldCreateWs;
    var f1 = null, f2 = null, f3 = null;
    var stub = null;
    var spy = null;

    beforeEach(function() {
      oldCreateWs = api.createWs;
      //stub the web socket construction
      api.createWs = function(url) {
        var mockWs = new Object();
        mockWs.readyState = WebSocket.CLOSED;
        mockWs.close = function() {};
        mockWs.send = function(value) {};
        return mockWs;
      }
      this.clock = sinon.useFakeTimers();
      createWsSpy = sinon.spy(api, 'createWs');
    });

    afterEach(function(){
      createWsSpy.restore();
      api.createWs = oldCreateWs;
      f1.samples = new SampleStore();
      f2.samples = new SampleStore();
      f3.samples = new SampleStore();
      stub && stub.restore && stub.restore();
      spy && spy.restore && spy.restore();
      this.clock.restore();
    });

    describe("#open", function() {
      it("should create a websocket and initialise it", function() {
        api.open();
        expect(createWsSpy).to.be.calledOnce;
        expect(api).to.have.property('ws');
        expect(api).not.to.be.a('null');
        expect(api.ws).to.have.property('onopen');
        expect(api.ws).to.have.property('onclose');
        expect(api.ws).to.have.property('onerror');
        expect(api.ws).to.have.property('onmessage');
        //on creation there should not be any timers running.
        expect(api.reconnectTimer).to.be.an('undefined');
        expect(api.heartBeatTimer).to.be.an('undefined');
      });
    });

    describe("#stop", function() {
      it("should clear the timers", function() {
        api.open();
        api.ws.onopen();
        api.stop(false);
        expect(api.reconnectTimer).to.be.an('undefined');
        expect(api.heartBeatTimer).to.be.an('undefined');
      });

      it("should reconnect if requested ", function() {
        api.open();
        api.ws.onopen();
        api.stop(true);
        stub = sinon.stub(api, 'open');
        this.clock.tick(11000);
        expect(stub).to.be.calledOnce;
        stub.restore();
      });

      it("should unsubscribe from all feeds if connected ", function() {
        stub = sinon.stub(api, 'unsubscribe');
        f1 = api.feedCache.get("1");
        f2 = api.feedCache.get("2");
        f3 = api.feedCache.get("3");
        f1.samples.onchanged(function() {});
        f2.samples.onchanged(function() {});

        api.open();

        api.ws.readyState = WebSocket.OPEN;
        api.stop(false);

        expect(stub).to.be.calledTwice;
        expect(stub).to.be.calledWith(f1);
        expect(stub).to.be.calledWith(f2);
        expect(stub).to.not.be.calledWith(f3);
      });
    });

    describe("api.ws", function() {

      describe("#send", function() {
        it("should send the message when connected", function() {
          api.open();
          stub = sinon.stub(api.ws, 'send');
          spy = sinon.spy(api, 'send');
          api.ws.readyState = WebSocket.OPEN;
          api.send({name: "value"});
          expect(stub).to.be.calledOnce;
          expect(stub).to.be.calledWithMatch('{"name":"value"}');
          expect(spy).to.returned(true);
        });

        it("should not send the message when not connected", function() {
          api.open();
          stub = sinon.stub(api.ws, 'send');
          spy = sinon.spy(api, 'send');
          api.ws.readyState = WebSocket.CLOSED;
          api.send({name: "value"});
          expect(stub).to.not.be.called;
          expect(spy).to.returned(false);
        });
      });
      describe("#onmessage", function() {

        var spy2 = null;
        var guid = "d7287feb180e4339c5d91784ada59b3d";
        var feed = api.feedCache.get(guid);
        var msgString = JSON.stringify({
          "guid": guid,
          "values": {
            "1.3670424E9": 0.04299999999999926,
            "1.367046E9": 0.04299999999999927,
            "1.3670496E9": 0.14300000000000068,
            "1.3670532E9": "NaN"
          }
        });
        var validMsg = { 'data' : msgString };

        beforeEach(function() {
          feed.samples = new SampleStore();
        });

        afterEach(function() {
          feed.samples = new SampleStore();
          spy2 && spy2.restore && spy2.restore();
          logger.restore();
        });

        it("should insert samples into the appropriate feed", function() {
          api.open();
          api.ws.onmessage(validMsg);

          expect(feed.samples.length).to.equal(4);
          expect(feed.samples.get(1367042400)).to.equal(0.04299999999999926);
          expect(feed.samples.get(1367046000)).to.equal(0.04299999999999927);
          expect(feed.samples.get(1367049600)).to.equal(0.14300000000000068);
          expect(isNaN(feed.samples.get(1367053200))).to.be.true;
        });

        it.skip("should log messages that it didn't understand", function() {
          api.open();
          spy = sinon.spy();

          logger.remove(winston.transports.Console);
          logger.add((spyLogger), { spy: spy });

          api.ws.onmessage({ 'data' : "this is some crap" });

          expect(feed.samples.length).to.equal(0);
          expect(spy).to.be.called;
        });

        it("should treat invalid values as NaN", function() {
          api.open();
          api.ws.onmessage({ 'data' : '{ "guid": "d7287feb180e4339c5d91784ada59b3d", "values": {"1.3670424E9" : "junk" }}' });
          expect(feed.samples.length).to.equal(1);
          expect(isNaN(feed.samples.get(1367042400))).to.be.true;
        });

        it("should notify all observers once", function() {
          api.open();
           spy = sinon.spy();
           spy2 = sinon.spy();
           feed.samples.onchanged(spy);
           feed.samples.onchanged(spy2);
           api.ws.onmessage(validMsg);
           expect(spy).to.be.calledOnce;
           expect(spy2).to.be.calledOnce;
        });
      });

      describe("#onopen", function() {
        f1 = api.feedCache.get("1");
        f2 = api.feedCache.get("2");
        f3 = api.feedCache.get("3");

        it("should subscribe to all feeds that have sample observers", function() {
          stub = sinon.stub(api, 'subscribe');
          f1.samples.onchanged(function() {});
          f2.samples.onchanged(function() {});
          api.ws.onopen();
          expect(stub).to.be.calledTwice;
          expect(stub).to.be.calledWith(f1);
          expect(stub).to.be.calledWith(f2);
          expect(stub).to.not.be.calledWith(f3);
        });

        it("should start the heartbeat timer", function() {
          api.open();
          stub = sinon.stub(api, 'send');
          api.ws.onopen();
          this.clock.tick(10000 * 2);
          expect(stub).to.be.calledTwice;
        });
      });
    });
  });
});