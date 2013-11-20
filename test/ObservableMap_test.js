var chai = require('chai'),
    sinon = require('sinon'),
    ObservableMap = require('../lib/ObservableMap.js').ili.ObservableMap,
    sinonChai = require("sinon-chai"),
    logger = require('../lib/Logger.js').ili.logger;

var expect = chai.expect;
chai.use(sinonChai);

describe("ObservableMap", function() {
  describe("insert", function() {
    it("to notify when an item is inserted", function() {
      var om = new ObservableMap();
      var spy = sinon.spy();
      om.addChangedObserver(spy);

      om.insert("name", "value");

      expect(om.items).to.have.keys(['name']);
      expect(om.items.name).to.equal("value");
      expect(spy).to.be.calledOnce;
    });

    it("to notify when an item is removed", function() {
      var om = new ObservableMap();
      var spy = sinon.spy();

      om.insert("name", "value");
      om.addChangedObserver(spy);
      om.remove("name");
      expect(om.items).to.not.have.keys(['name']);
      expect(spy).to.be.calledOnce;
    });

    it("to notify when cleared", function() {
      var om = new ObservableMap();
      var spy = sinon.spy();

      om.insert("name", "value");
      om.addChangedObserver(spy);
      om.clear();
      expect(om.items).to.not.have.keys(['name']);
      expect(spy).to.be.calledOnce;
    });

    it("not to notify when notify is disabled", function() {
      var om = new ObservableMap();
      var spy = sinon.spy();

      om.addChangedObserver(spy);

      om.disableNotification();
      om.insert("name", "value");
      expect(om.items).to.have.keys(['name']);
      expect(spy).not.to.be.called;

      om.enableNotification();
      expect(spy).to.be.called;
    });

    it("not to notify after all observers have been removed", function() {

    });
  });
});