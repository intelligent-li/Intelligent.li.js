var chai = require('chai'),
    sinon = require('sinon'),
    $ = require('jQuery'),
    Feed = require('../lib/Feed.js').Feed,
    feedCache = require('../lib/Feed.js').feedCache
    api = require('../lib/Api.js').instance,
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
    it.skip("should send subscribe message when observer is added", function() {

    });

    it.skip("should send unsubscribe message when last observer is removed", function() {

    });

    it.skip("should allow start time to be set (before an observer is added)", function() {

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