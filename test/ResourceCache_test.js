var chai = require('chai'),
    sinon = require('sinon'),
    ResourceCache = require('../lib/ResourceCache.js').ResourceCache,
    Feed = require('../lib/Feed.js').Feed,
    sinonChai = require("sinon-chai");

var expect = chai.expect;
chai.use(sinonChai);

describe("ResourceCache", function(done) {

  describe("constructor", function() {
    it("should call the parent constructor", function() {

    });
  });

  describe("#get", function() {
    it("should call the abstract create", function() {
      var rc = new ResourceCache();
      rc.create = function(id) {
        return new Feed(id);
      }
      var spy = sinon.spy(rc, 'create');

      var f = rc.get("123456");
      expect(f.id).to.equal("123456");
      expect(f.type).to.equal("feeds");

      expect(spy).to.be.calledOnce;
      spy.restore();
    });
  });

  describe("#free", function() {
    it("should remove the resource from the cache", function() {
      var rc = new ResourceCache();
      rc.create = function(id) {
        return new Feed(id);
      }
      var f = rc.get("123456");
      expect(f.id).to.equal("123456");
      expect(f.type).to.equal("feeds");

      rc.free("123456");

      expect(rc.resources).to.not.have.keys(['123456']);

    });
  });
});