'use strict';

var service = require('feathers-sequelize');
var user = require('./user-model');
var hooks = require('./hooks');

module.exports = function(){
  var app = this;

  var options = {
    Model: user(app.get('sequelize')),
    paginate: {
      default: 5,
      max: 25
    }
  };

  // Initialize our service with any options it requires
  app.use('/users', service(options));

  // Get our initialize service to that we can bind hooks
  var userService = app.service('/users');

  // Set up our before hooks
  userService.before(hooks.before);

  // Set up our after hooks
  userService.after(hooks.after);
};
