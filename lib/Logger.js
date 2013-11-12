var winston = require('winston');

logger = new (winston.Logger)();

var restore = function()
{
  logger.clear();
  logger.add(winston.transports.Console, { level: 'info' });
};

restore();

exports.restore = restore;
exports.logger = logger;
exports.setLogger = function(newLogger){ logger =  newLogger; };
exports.getLogger = function() { return logger; };
exports.info = logger.info;
exports.error = logger.error;
exports.warn = logger.warn;