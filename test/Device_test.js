var chai = require('chai'),
    sinon = require('sinon'),
    $ = require('jQuery'),
    Device = require('../lib/Device.js').Device,
    deviceCache = require('../lib/Device.js').deviceCache
    api = require('../lib/Api.js').Api.instance,
    sinonChai = require("sinon-chai");

var expect = chai.expect;
chai.use(sinonChai);

describe("Device", function(done) {
  describe("constructor", function() {
    it("should call the parent constructor", function() {
      var d = new Device("639bae9ac6b3e1a84cebb7b403297b79");
      expect(d.id).to.equal("639bae9ac6b3e1a84cebb7b403297b79");
      expect(d.type).to.equal("devices");
      expect(d.resource()).to.equal("devices/639bae9ac6b3e1a84cebb7b403297b79");
    });
  });
});

describe("DeviceCache", function(done) {
  describe("#get", function() {
    it("should call get one Device instance", function() {
      var d1 = deviceCache.get("639bae9ac6b3e1a84cebb7b403297b79");
      expect(d1.id).to.equal("639bae9ac6b3e1a84cebb7b403297b79");
      expect(d1.type).to.equal("devices");

      var d2 = deviceCache.get("639bae9ac6b3e1a84cebb7b403297b79");
      expect(d2).to.equal(d1);
    });
  });
});