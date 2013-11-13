if (typeof Meteor === 'undefined') {
  var winston = require('winston');
} else {
  var winston = Npm.require('winston');
}

var logger = new (winston.Logger)();

logger.restore = function()
{
  logger.clear();
  logger.add(winston.transports.Console, { level: 'info' });
  logger.info("Logger restored to default settings");
};

logger.restore();

if (typeof Meteor === 'undefined') {
   exports.logger = logger;
} else {
    ili_logger = logger;
}
