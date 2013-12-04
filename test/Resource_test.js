var chai = require('chai'),
    sinon = require('sinon'),
    api = require('../lib/Api.js').ili.Api.instance,
    Resource = require('../lib/Resource.js').ili.Resource,
    sinonChai = require("sinon-chai"),
    nock = require('nock');

var expect = chai.expect;
chai.use(sinonChai);

describe("Resource", function(done) {
  describe("constructor", function() {
    it("should remember its id", function() {
      var r = new Resource("feeds", "639bae9ac6b3e1a84cebb7b403297b79");
      expect(r.id).to.equal("639bae9ac6b3e1a84cebb7b403297b79");
      expect(r.type).to.equal("feeds");
      expect(r.resource()).to.equal("feeds/639bae9ac6b3e1a84cebb7b403297b79");
    });

    it("should have an empty attributes map", function() {
      var r = new Resource("feeds", "639bae9ac6b3e1a84cebb7b403297b79");
      expect(r.attributes).not.to.be.undefined;
      expect(r.attributes.items).to.be.empty;
    });

    it("should have an empty tags map", function() {
      var r = new Resource("feeds", "639bae9ac6b3e1a84cebb7b403297b79");
      expect(r.tags).not.to.be.undefined;
      expect(r.tags.items).to.be.empty;
    });

    it("should have an empty location map", function() {
      var r = new Resource("feeds", "639bae9ac6b3e1a84cebb7b403297b79");
      expect(r.location).not.to.be.undefined;
      expect(r.location.items).to.be.empty;
    });
  });

  describe("#loadTags", function() {
    var stub;
    afterEach(function(){
      stub.restore();
    });

    it("should call the api with the correct resource", function() {
      var r = new Resource("feeds", "639bae9ac6b3e1a84cebb7b403297b79");

      stub = sinon.stub(api, 'loadResource');
      var cb = sinon.spy();

      r.loadTags(cb);

      expect(stub).to.be.called;
      expect(stub).to.be.calledWith(
        "feeds/639bae9ac6b3e1a84cebb7b403297b79/tags",
        r.tags
      );

    });

    it("should load the tags into the feed", function(done) {
      var feedNock = nock('https://au.intelligent.li')
        .get('/api/v1/feeds/639bae9ac6b3e1a84cebb7b403297b79/tags')
        .reply(200,  { name1: "value1", name2 : "value2" });

      var r = new Resource("feeds", "639bae9ac6b3e1a84cebb7b403297b79");

      r.loadTags(function(result){
        expect(r.tags.items).to.have.keys(['name1', 'name2']);
        expect(r.tags.items.name1).to.equal("value1");
        expect(r.tags.items.name2).to.equal("value2");
        done();
      });
    });
  });

  describe("#loadAttributes", function() {
    var stub;
    afterEach(function(){
      stub.restore();
    });

    it("should call the api with the correct resource", function() {
      var r = new Resource("feeds", "639bae9ac6b3e1a84cebb7b403297b79");

      stub = sinon.stub(api, 'loadResource');
      var cb = sinon.spy();

      r.loadAttributes(cb);

      expect(stub).to.be.calledWith(
        "feeds/639bae9ac6b3e1a84cebb7b403297b79",
        r.attributes);
    });

    it("should load attributes into the resource", function(done) {
      var feedNock = nock('https://au.intelligent.li')
        .get('/api/v1/feeds/639bae9ac6b3e1a84cebb7b403297b79')
        .reply(200,  { name1: "value1", name2 : "value2" });

      var r = new Resource("feeds", "639bae9ac6b3e1a84cebb7b403297b79");

      r.loadAttributes(function(result){
        expect(r.attributes.items).to.have.keys(['name1', 'name2']);
        expect(r.attributes.items.name1).to.equal("value1");
        expect(r.attributes.items.name2).to.equal("value2");
        done();
      });
    });
  });
});