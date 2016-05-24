'use strict';

var authentication = require('feathers-authentication');


module.exports = function() {
  var app = this;

  var config = app.get('auth');

  config.idField = 'id';

  app.configure(authentication(config));
};
