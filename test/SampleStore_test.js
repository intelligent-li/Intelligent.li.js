var chai = require('chai'),
    sinon = require('sinon'),
    SampleStore = require('../lib/SampleStore.js').SampleStore,
    sinonChai = require("sinon-chai"),
    logger = require('../lib/Logger.js');

var expect = chai.expect;
chai.use(sinonChai);

describe("SampleStore", function() {
  describe("insert", function() {
    it("to update last value and time", function() {
      var ss = new SampleStore();

      expect(isNaN(ss.firstValue)).to.be.true;
      expect(isNaN(ss.lastValue)).to.be.true;
      expect(ss.lastTime).to.equal(0);
      expect(isNaN(ss.firstTime)).to.be.true;

      ss.insert(1367042400, 0.1);
      expect(ss.lastValue).to.equal(0.1);
      expect(ss.firstValue).to.equal(0.1);

      expect(ss.firstTime).to.equal(1367042400);
      expect(ss.lastTime).to.equal(1367042400);

      ss.insert(1367046000, 0.2);
      expect(ss.firstValue).to.equal(0.1);
      expect(ss.lastValue).to.equal(0.2);
      expect(ss.firstTime).to.equal(1367042400);
      expect(ss.lastTime).to.equal(1367046000);
    });


    it("to update max and min values", function() {
      var ss = new SampleStore();

      ss.insert(1367042400, 0.2);
      expect(ss.max).to.equal(0.2);
      expect(ss.min).to.equal(0.2);

      ss.insert(1367046000, 0.1);
      expect(ss.max).to.equal(0.2);
      expect(ss.min).to.equal(0.1);

      ss.insert(1367047000, 0.3);
      expect(ss.max).to.equal(0.3);
      expect(ss.min).to.equal(0.1);

      ss.insert(1367047000, -0.1);
      expect(ss.max).to.equal(0.3);
      expect(ss.min).to.equal(-0.1);
    });
  });
});