'use strict';

var winston = require('winston');

module.exports = function(app) {
  // Add a logger to our app object for convenience
  app.logger = winston;

  return function(error, req, res, next) {
    if (error) {

      var message = (error.code || '') + ' Route: ' + req.url + ' - ' + error.message;

      if (error.code === 404) {
        winston.info(message);
      }
      else {
        winston.error(message);
        winston.info(error.stack);
      }
    }

    next(error);
  };
};
