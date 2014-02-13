var chai = require('chai'),
    sinon = require('sinon'),
    Collection = require('../lib/Collection.js').ili.Collection,
    collectionCache = require('../lib/Collection.js').ili.collectionCache
    Feed = require('../lib/Feed.js').ili.Feed,
    feeds = require('../lib/Feed.js').ili.feeds,
    Source = require('../lib/Source.js').ili.Source,
    sources = require('../lib/Source.js').ili.sources,
    api = require('../lib/Api.js').ili.Api.instance,
    sinonChai = require("sinon-chai"),
    nock = require('nock');

var expect = chai.expect;
chai.use(sinonChai);

describe("Collection", function(done) {
  describe("#loadTags", function(done) {
    it("should load child tags", function(done) {
      var feedNock = nock('https://au.intelligent.li:443')
        .get('/api/v1/collections/c1/tags?recursive=true')
        .reply(200,  {
          "collection" : {
              "displayname":"Mark's House",
              "location":"moonee ponds",
           },
           "feeds": {
               "35a322a37e6fb34b2aaea6f4ed30aa7f": {
                   "name" : "total consumption (daily)"
               },
               "65cb40f784b135ee5c70f32f1aab351b": {
                   "name" : "total consumption (weekly)"
               }
           },
           "sources": {
               "35a322a37e6fb34b2aaea6f4ed30aa7f": {
                   "name" : "total consumption (daily) sensor"
               },
               "65cb40f784b135ee5c70f32f1aab351b": {
                   "name" : "total consumption (weekly) sensor"
               }
           }
        });

      var c = new Collection("c1");

      c.loadTags(function(result) {
        expect(c.tags.items).to.have.keys(['displayname', 'location']);
        expect(c.tags.items.displayname).to.equal("Mark's House");
        expect(c.tags.items.location).to.equal("moonee ponds");

        var f1 = feeds.get("35a322a37e6fb34b2aaea6f4ed30aa7f");
        expect(f1.tags.items).to.have.keys(['name']);
        expect(f1.tags.items.name).to.equal("total consumption (daily)");
        var f2 = feeds.get("65cb40f784b135ee5c70f32f1aab351b");
        expect(f2.tags.items).to.have.keys(['name']);
        expect(f2.tags.items.name).to.equal("total consumption (weekly)");

        var s1 = sources.get("35a322a37e6fb34b2aaea6f4ed30aa7f");
        expect(s1.tags.items).to.have.keys(['name']);
        expect(s1.tags.items.name).to.equal("total consumption (daily) sensor");
        var s2 = sources.get("65cb40f784b135ee5c70f32f1aab351b");
        expect(s2.tags.items).to.have.keys(['name']);
        expect(s2.tags.items.name).to.equal("total consumption (weekly) sensor");

        done();
      });
    });
  });
});