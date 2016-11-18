'use strict';

var service = require('feathers-sequelize');
var analysis = require('./analysis-model');
var hooks = require('./hooks');

module.exports = function(){
  var app = this;

  var options = {
    Model: analysis(app.get('sequelize')),
    paginate: {
      default: 10,
      max: 25
    }
  };

  // Initialize our service with any options it requires
  app.use('/analysis', service(options));

  // Get our initialize service to that we can bind hooks
  var analysisService = app.service('/analysis');

  // Set up our before hooks
  analysisService.before(hooks.before);

  // Set up our after hooks
  analysisService.after(hooks.after);
};
