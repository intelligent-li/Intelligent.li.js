var chai = require('chai'),
    sinon = require('sinon'),
    Feed = require('../lib/Feed.js').ili.Feed,
    feedCache = require('../lib/Feed.js').ili.feedCache
    api = require('../lib/Api.js').ili.Api.instance,
    sinonChai = require("sinon-chai");

var expect = chai.expect;
chai.use(sinonChai);

describe("Feed", function(done) {
  describe("constructor", function() {
    it("should call the parent constructor", function() {
      var f = new Feed("639bae9ac6b3e1a84cebb7b403297b79");
      expect(f.id).to.equal("639bae9ac6b3e1a84cebb7b403297b79");
      expect(f.type).to.equal("feeds");
      expect(f.resource()).to.equal("feeds/639bae9ac6b3e1a84cebb7b403297b79");
    });
  });

  describe("samples", function() {
    var subscribeStub, loadResourceStub;
    afterEach(function(){
      subscribeStub.restore();
      loadResourceStub.restore();
    });

    it("should load samples from 'start'", function() {
      subscribeStub = sinon.stub(api, 'subscribe');
      loadResourceStub = sinon.stub(api, 'loadResource', function(resource, map, notify, parser){
        var d = JSON.parse('{ "guid": "639bae9ac6b3e1a84cebb7b403297b79", "values": { "1.386117685E9": 20.0, "1.386117695E9": 21.0, "1.38611769E9": 22.0}}');
        parser(map, d);
        notify && notify(true);
      });

      var f = new Feed("639bae9ac6b3e1a84cebb7b403297b79");
      var spy1 = sinon.spy(function(changes){
         expect(f.samples.get(1386117685)).to.equal(20);
         expect(changes[0][1386117685]).to.equal(20);
      });
      f.setStart(1386117685);
      expect(loadResourceStub).to.be.called;

      f.samples.onchanged(spy1);
      expect(subscribeStub).to.be.called;
      expect(spy1).to.be.called;
    });

    it("should load samples from 'start' for second observer", function() {
      subscribeStub = sinon.stub(api, 'subscribe');
      loadResourceStub = sinon.stub(api, 'loadResource', function(resource, map, notify, parser){
        var d = JSON.parse('{ "guid": "639bae9ac6b3e1a84cebb7b403297b79", "values": { "1.386117685E9": 20.0, "1.386117695E9": 21.0, "1.38611769E9": 22.0}}');
        parser(map, d);
        notify && notify(true);
      });

      var f = new Feed("639bae9ac6b3e1a84cebb7b403297b79");
      f.setStart(1386117685);
      f.samples.onchanged(function(){}); //the first observer

      var spy1 = sinon.spy(function(changes){
         expect(f.samples.get(1386117685)).to.equal(20);
         expect(changes[0][1386117685]).to.equal(20);
      });
      subscribeStub.restore();
      subscribeStub = sinon.stub(api, 'subscribe');

      f.samples.onchanged(spy1);
      expect(subscribeStub).not.to.be.called;
      expect(loadResourceStub).to.be.called;
      expect(spy1).to.be.called;
    });

    it("should load samples from 'start' for second observer with new start time", function() {
      subscribeStub = sinon.stub(api, 'subscribe');
      loadResourceStub = sinon.stub(api, 'loadResource', function(resource, map, notify, parser){
        var d = JSON.parse('{ "guid": "639bae9ac6b3e1a84cebb7b403297b79", "values": { "1.386117685E9": 20.0, "1.386117695E9": 21.0, "1.38611769E9": 22.0}}');
        parser(map, d);
        notify && notify(true);
      });

      var f = new Feed("639bae9ac6b3e1a84cebb7b403297b79");
      f.setStart(1386117685);
      f.samples.onchanged(function(){}); //the first observer

      loadResourceStub.restore();
      loadResourceStub = sinon.stub(api, 'loadResource', function(resource, map, notify, parser){
        var d = JSON.parse('{ "guid": "639bae9ac6b3e1a84cebb7b403297b79", "values": { "1.386117680E9": 19.0}}');
        parser(map, d);
        notify && notify(true);
      });

      f.setStart(1386117680);
      expect(loadResourceStub).to.be.called;

      var spy1 = sinon.spy(function(changes){
         expect(f.samples.get(1386117680)).to.equal(19);
         expect(changes[0][1386117680]).to.equal(19);
      });

      subscribeStub.restore();
      subscribeStub = sinon.stub(api, 'subscribe');

      f.samples.onchanged(spy1);
      expect(subscribeStub).not.to.be.called;
      expect(spy1).to.be.called;
    });

    it.skip("should send unsubscribe message when last observer is removed", function() {

    });

  });
});

describe("FeedCache", function(done) {
  it("should register with the API", function() {
    expect(api.feedCache).to.not.be.undefined
  });

  describe("#get", function() {
    it("should call get one feed instance", function() {
      var f1 = feedCache.get("639bae9ac6b3e1a84cebb7b403297b79");
      expect(f1.id).to.equal("639bae9ac6b3e1a84cebb7b403297b79");
      expect(f1.type).to.equal("feeds");

      var f2 = feedCache.get("639bae9ac6b3e1a84cebb7b403297b79");
      expect(f2).to.equal(f1);
    });
  });
});