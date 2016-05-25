'use strict';

var handler = require('feathers-errors/handler');
var notFound = require('./not-found-handler');
var logger = require('./logger');

module.exports = function() {
  // Add your custom middleware here. Remember, that
  // just like Express the order matters, so error
  // handling middleware should go last.
  var app = this;

  app.use(notFound());
  app.use(logger(app));
  app.use(handler());
};
