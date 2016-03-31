'use strict';

var authentication = require('feathers-authentication');


module.exports = function() {
  var app = this;

  var config = app.get('auth');

  app.configure(authentication(config));
};
