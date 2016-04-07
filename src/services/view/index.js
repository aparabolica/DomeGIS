'use strict';

var service = require('feathers-sequelize');
var view = require('./view-model');
var hooks = require('./hooks');

module.exports = function(){
  var app = this;

  var options = {
    Model: view(app.get('sequelize')),
    paginate: {
      default: 5,
      max: 25
    }
  };

  // Initialize our service with any options it requires
  app.use('/views', service(options));

  // Get our initialize service to that we can bind hooks
  var viewService = app.service('/views');

  // Set up our before hooks
  viewService.before(hooks.before);

  // Set up our after hooks
  viewService.after(hooks.after);
};
