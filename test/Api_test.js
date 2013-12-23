var expect = require('chai').expect,
    Api = require('../lib/Api.js').ili.Api,
    logger = require('../lib/logger.js').ili.Logger.instance,
    api = require('../lib/Api.js').ili.Api.instance,
    feedCache = require('../lib/Feed.js').ili.feedCache,
    sinon = require('sinon'),
    sinonChai = require('sinon-chai'),
    $ = require('jQuery'),
    ObservableMap = require('../lib/ObservableMap.js').ili.ObservableMap,
    SampleStore = require('../lib/SampleStore.js').ili.SampleStore,
    spyLogger = require('winston-spy'),
    winston = require('winston'),
    WebSocket = require('ws'),
    nock = require('nock');

describe("Api", function() {
  describe("constructor", function() {
    it("should default to use production", function() {
      expect(api._host).to.equal("au.intelligent.li");
    });

    it("should allow the host to be specified", function() {
      var a = new Api("a different host");
      expect(a._host).to.equal("a different host");
    });

    it("should have a singleton instance that uses the default host", function() {
      expect(api).to.be.defined;
      expect(api._host).to.equal("au.intelligent.li");
    });
  });

 describe("#loadBlob", function(done) {
    beforeEach(function(){

    });

    afterEach(function(){

    });

    it("should form correct http request", function(done) {
      var blobNock = nock('https://au.intelligent.li')
        .get('/api/v1/sources/c-1/s-1/blobs/100/5')
        .reply(200, {});

      api.loadBlob("c-1", "s-1", 100, 5, function(success, blob) {
        expect(success).to.be.true;
        done();
      });
    });
    it("should  base64 encode the blob", function(done) {
      var blobNock = nock('https://au.intelligent.li')
        .get('/api/v1/sources/c-1/s-1/blobs/100/5')
        .reply(200, "1234567890");

      api.loadBlob("c-1", "s-1", 100, 5, function(success, blob) {
        logger.info("####: " + blob);
        expect(blob.data).to.equal("MTIzNDU2Nzg5MA==");
        expect(success).to.be.true;
        done();
      });
    });
  });

  describe("#loadSamples", function(done) {
    afterEach(function(){
      api.feedCache.get("feed-1").samples = new SampleStore();
    });

    it("should request leading and trailing samples when start is before and end is after", function(done){
      var feed = api.feedCache.get("feed-1");
      feed.samples.insert(3,3);
      feed.samples.insert(4,4);
      feed.samples.insert(5,5);

      var samplesLeadingNock = nock('https://au.intelligent.li')
        .get('/api/v1/feeds/feed-1/samples?start=1&end=3')
        .reply(200, { guid: "feed-1", values : { 1: "1", 2: "2", 3: "3" }});

      var samplesTrailingNock = nock('https://au.intelligent.li')
        .get('/api/v1/feeds/feed-1/samples?start=5&end=7')
        .reply(200, { guid: "feed-1", values : { 5: "5", 6: "6", 7:"7" }});

      api.loadSamples(feed.id, 1, 7, function(success){
        expect(success).to.be.true;
        expect(feed.samples.get(1)).to.equal(1);
        expect(feed.samples.get(2)).to.equal(2);
        expect(feed.samples.get(3)).to.equal(3);
        expect(feed.samples.get(4)).to.equal(4);
        expect(feed.samples.get(5)).to.equal(5);
        expect(feed.samples.get(6)).to.equal(6);
        expect(feed.samples.get(7)).to.equal(7);
        done();
      });

    });
    it("should load an empty map from start to end", function(done){
      var feed = api.feedCache.get("feed-1");

      var samplesLeadingNock = nock('https://au.intelligent.li')
        .get('/api/v1/feeds/feed-1/samples?start=1&end=3')
        .reply(200, { guid: "feed-1", values : { 1: "1", 2: "2", 3: "3" }});


      api.loadSamples(feed.id, 1, 3, function(success){
        expect(success).to.be.true;
        expect(feed.samples.get(1)).to.equal(1);
        expect(feed.samples.get(2)).to.equal(2);
        expect(feed.samples.get(3)).to.equal(3);
        done();
      });
    });

    it("should only load leading when end is before firstTime", function(done){
      var feed = api.feedCache.get("feed-1");
      feed.samples.insert(4,4);
      feed.samples.insert(5,5);

      var samplesLeadingNock = nock('https://au.intelligent.li')
        .get('/api/v1/feeds/feed-1/samples?start=1&end=2')
        .reply(200, { guid: "feed-1", values : { 1: "1", 2: "2"}});


      api.loadSamples(feed.id, 1, 2, function(success){
        expect(success).to.be.true;
        expect(feed.samples.get(1)).to.equal(1);
        expect(feed.samples.get(2)).to.equal(2);
        expect(feed.samples.get(3)).not.to.equal(3);
        expect(feed.samples.get(4)).to.equal(4);
        expect(feed.samples.get(5)).to.equal(5);
        done();
      });
    });

    it("should only load trailing when start is after lastTime", function(done){
      var feed = api.feedCache.get("feed-1");
      feed.samples.insert(1,1);
      feed.samples.insert(2,2);

      var samplesLeadingNock = nock('https://au.intelligent.li')
        .get('/api/v1/feeds/feed-1/samples?start=4&end=5')
        .reply(200, { guid: "feed-1", values : { 4: "4", 5: "5"}});


      api.loadSamples(feed.id, 4, 5, function(success){
        expect(success).to.be.true;
        expect(feed.samples.get(1)).to.equal(1);
        expect(feed.samples.get(2)).to.equal(2);
        expect(feed.samples.get(3)).not.to.equal(3);
        expect(feed.samples.get(4)).to.equal(4);
        expect(feed.samples.get(5)).to.equal(5);
        done();
      });
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
        expect(api).to.have.property('_ws');
        expect(api).not.to.be.a('null');
        expect(api._ws).to.have.property('onopen');
        expect(api._ws).to.have.property('onclose');
        expect(api._ws).to.have.property('onerror');
        expect(api._ws).to.have.property('onmessage');
        //on creation there should not be any timers running.
        expect(api.reconnectTimer).to.be.an('undefined');
        expect(api.heartBeatTimer).to.be.an('undefined');
      });
    });

    describe("#stop", function() {
      it("should clear the timers", function() {
        api.open();
        api._ws.onopen();
        api.stop(false);
        expect(api.reconnectTimer).to.be.an('undefined');
        expect(api.heartBeatTimer).to.be.an('undefined');
      });

      it("should reconnect if requested ", function() {
        api.open();
        api._ws.onopen();
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

        api._ws.readyState = WebSocket.OPEN;
        api.stop(false);

        expect(stub).to.be.calledTwice;
        expect(stub).to.be.calledWith(f1);
        expect(stub).to.be.calledWith(f2);
        expect(stub).to.not.be.calledWith(f3);
      });
    });

    describe("api._ws", function() {

      describe("#send", function() {
        it("should send the message when connected", function() {
          api.open();
          stub = sinon.stub(api._ws, 'send');
          spy = sinon.spy(api, 'send');
          api._ws.readyState = WebSocket.OPEN;
          api.send({name: "value"});
          expect(stub).to.be.calledOnce;
          expect(stub).to.be.calledWithMatch('{"name":"value"}');
          expect(spy).to.returned(true);
        });

        it("should not send the message when not connected", function() {
          api.open();
          stub = sinon.stub(api._ws, 'send');
          spy = sinon.spy(api, 'send');
          api._ws.readyState = WebSocket.CLOSED;
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
          api._ws.onmessage(validMsg);

          expect(feed.samples.length).to.equal(4);
          expect(feed.samples.get(1367042400)).to.equal(0.04299999999999926);
          expect(feed.samples.get(1367046000)).to.equal(0.04299999999999927);
          expect(feed.samples.get(1367049600)).to.equal(0.14300000000000068);
          expect(isNaN(feed.samples.get(1367053200))).to.be.true;
        });

        //this was created due to defect noticed whilst using the api
        it("should handle zero valued samples", function() {
          api.open();

          var msg0String = JSON.stringify({
            "guid": guid,
            "values": {  "1.3670424E9": 0,
              "1.3670434E9": 0.0,
              "1.3670444E9": "0",
              "1.3670454E9": "0.0"}

          });
          var valid0Msg = { 'data' : msg0String };
          api._ws.onmessage(valid0Msg);

          expect(feed.samples.length).to.equal(4);
          expect(feed.samples.get(1367042400)).to.equal(0);
          expect(feed.samples.get(1367043400)).to.equal(0);
          expect(feed.samples.get(1367044400)).to.equal(0);
          expect(feed.samples.get(1367045400)).to.equal(0);
        });

        it.skip("should log messages that it didn't understand", function() {
          api.open();
          spy = sinon.spy();

          logger.remove(winston.transports.Console);
          logger.add((spyLogger), { spy: spy });

          api._ws.onmessage({ 'data' : "this is some crap" });

          expect(feed.samples.length).to.equal(0);
          expect(spy).to.be.called;
        });

        it("should treat invalid values as NaN", function() {
          api.open();
          api._ws.onmessage({ 'data' : '{ "guid": "d7287feb180e4339c5d91784ada59b3d", "values": {"1.3670424E9" : "junk" }}' });
          expect(feed.samples.length).to.equal(1);
          expect(isNaN(feed.samples.get(1367042400))).to.be.true;
        });

        it("should notify all observers once", function() {
          api.open();
           spy = sinon.spy();
           spy2 = sinon.spy();
           feed.samples.onchanged(spy);
           feed.samples.onchanged(spy2);
           api._ws.onmessage(validMsg);
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
          api._ws.onopen();
          expect(stub).to.be.calledTwice;
          expect(stub).to.be.calledWith(f1);
          expect(stub).to.be.calledWith(f2);
          expect(stub).to.not.be.calledWith(f3);
        });

        it("should start the heartbeat timer", function() {
          api.open();
          stub = sinon.stub(api, 'send');
          api._ws.onopen();
          this.clock.tick(10000 * 2);
          expect(stub).to.be.calledTwice;
        });
      });
    });
  });
});