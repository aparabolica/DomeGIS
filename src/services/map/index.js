'use strict';

var service = require('feathers-sequelize');
var map = require('./map-model');
var hooks = require('./hooks');

module.exports = function(){
  var app = this;

  var options = {
    Model: map(app.get('sequelize')),
    paginate: {
      default: 10,
      max: 25
    }
  };

  // Initialize our service with any options it requires
  app.use('/maps', service(options));

  // Get our initialize service to that we can bind hooks
  var mapService = app.service('/maps');

  // Set up our before hooks
  mapService.before(hooks.before);

  // Set up our after hooks
  mapService.after(hooks.after);
};
