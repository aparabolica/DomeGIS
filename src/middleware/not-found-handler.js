'use strict';

var errors = require('feathers-errors');

module.exports = function() {
  return function(req, res, next) {
    next(new errors.NotFound('Page not found'));
  };
};
