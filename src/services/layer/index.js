'use strict';

var service = require('feathers-sequelize');
var layer = require('./layer-model');
var hooks = require('./hooks');

module.exports = function(){
  var app = this;

  var options = {
    Model: layer(app.get('sequelize')),
    paginate: {
      default: 5,
      max: 25
    }
  };

  // Initialize our service with any options it requires
  app.use('/layers', service(options));

  // Get our initialize service to that we can bind hooks
  var layerService = app.service('/layers');

  // Set up our before hooks
  layerService.before(hooks.before);

  // Set up our after hooks
  layerService.after(hooks.after);
};
