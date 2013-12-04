/*
 * Logger.js Copyright Percepscion Pty. Ltd.
 */
(function(root) {
  "use strict";
  (typeof root.ili === 'undefined') && (root.ili = require('./Utils.js').ili);
  var ili = root.ili;

  if (typeof Meteor === 'undefined') {
    var winston = require('winston');
    var logger = new (winston.Logger)();
  } else {
    if (Meteor.isClient) {
      // we don't attempt to load winston on the client, so lets create a simple
      // replacement that uses console.
      var ClientLogger = function() {
        this.clear = function() {}
        this.add = function() {}
        this.info = function(m) { console.log("info: " + m); }
        this.error = function(m) { console.log("error: " + m); }
        this.warn = function(m) { console.log("warn: " + m); }
      } 
      var winston = {}
      winston.Logger = ClientLogger;
      winston.transports = { Console: ""};
    } else {
      var winston = Npm.require('winston');
    }
  }

  var logger = new (winston.Logger)();

  logger.restore = function()
  {
    logger.clear();
    logger.add(winston.transports.Console, { level: 'info' });
    logger.info("Logger restored to default settings");
  };

  logger.restore();
  root.ili.Logger = new Object();
  root.ili.Logger.instance = logger;

})(this);
