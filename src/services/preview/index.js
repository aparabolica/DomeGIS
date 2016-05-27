'use strict';

var service = require('feathers-sequelize');
var preview = require('./preview-model');
var hooks = require('./hooks');

module.exports = function(){
  var app = this;

  var options = {
    Model: preview(app.get('sequelize')),
    paginate: {
      default: 5,
      max: 25
    }
  };

  // Initialize our service with any options it requires
  app.use('/previews', service(options));

  // Get our initialize service to that we can bind hooks
  var previewService = app.service('/previews');

  // Set up our before hooks
  previewService.before(hooks.before);

  // Set up our after hooks
  previewService.after(hooks.after);
};
