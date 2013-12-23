var chai = require('chai'),
    sinon = require('sinon'),
    BlobFeed = require('../lib/BlobFeed.js').ili.BlobFeed,
    feedCache = require('../lib/Feed.js').ili.feedCache
    api = require('../lib/Api.js').ili.Api.instance,
    sinonChai = require("sinon-chai");

var expect = chai.expect;
chai.use(sinonChai);

describe("BlobFeed", function(done) {
  describe("constructor", function() {
    it("should call the parent constructor", function() {
      var f = new BlobFeed("639bae9ac6b3e1a84cebb7b403297b79", 5);
      expect(f.id).to.equal("639bae9ac6b3e1a84cebb7b403297b79");
      expect(f.type).to.equal("feeds");
      expect(f.resource()).to.equal("feeds/639bae9ac6b3e1a84cebb7b403297b79");
    });

    it("should set the alignment", function() {
      var f = new BlobFeed("639bae9ac6b3e1a84cebb7b403297b79", 5);
      expect(f._alignment).to.equal(5);
    });

    it("should not have a samples member", function() {
      var f = new BlobFeed("639bae9ac6b3e1a84cebb7b403297b79", 5);
      expect(f.samples).to.be.undefined;
    });
  });

  describe("index", function() {
    beforeEach(function() {
      this.clock = sinon.useFakeTimers();
    });

    afterEach(function(){
       this.clock.restore();
    });

    it("should take time as an argument", function() {
      var f = new BlobFeed("639bae9ac6b3e1a84cebb7b403297b79", 5);
      expect(f._index(1001)).to.equal(200);
    });
    it("should use now if time not supplied as an argument", function() {
       var f = new BlobFeed("639bae9ac6b3e1a84cebb7b403297b79", 5);
       this.clock.tick(1001 * 1000);
       expect(f._index()).to.equal(200);
     });
  });
  describe("latest", function() {
    it("should call get the latest blob", function() {
      var f = new BlobFeed("639bae9ac6b3e1a84cebb7b403297b79");

      expect(f.id).to.equal("639bae9ac6b3e1a84cebb7b403297b79");
      expect(f.type).to.equal("feeds");
      expect(f.resource()).to.equal("feeds/639bae9ac6b3e1a84cebb7b403297b79");
    });
  });
});