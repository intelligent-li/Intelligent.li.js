var chai = require('chai'),
    sinon = require('sinon'),
    ResourceCache = require('../lib/ResourceCache.js').ili.ResourceCache,
    Feed = require('../lib/Feed.js').ili.Feed,
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

  describe("#queryResource", function() {
    var stub;
    afterEach(function(){
      stub1 && stub1.restore();
      stub2 && stub2.restore();
    });

    it("should perform a query on ili", function() {
      stub1 = sinon.spy(api, 'queryResource');
      stub2 = sinon.stub(api, 'loadResource');

      var rc = new ResourceCache("test");
      rc.create = function(id) {
        return new Feed(id);
      }
      var cb = function(success, result) {}
      rc.query("*", cb);

      expect(stub1).to.be.called;
      expect(stub1).to.be.calledWith("*", rc.type, cb);

      expect(stub2).to.be.called;
      expect(stub2).to.be.calledWith("test/search?q=*");
    });

    it("should notify with search results", function(done) {
      stub1 = sinon.spy(api, 'queryResource');

      stub2 = sinon.stub(api, 'loadResource', function(r, m, notify) {
        m.insert("1", "11");
        m.insert("2", "2");
        notify(true, m);
      });

      var rc = new ResourceCache("test");
      rc.create = function(id) {
        return new Feed(id);
      }

      rc.query("*", function(success, result) {
        expect(success).to.be.true;
        expect(result.length).to.equal(2);
        done();
      });
    });
  });
});