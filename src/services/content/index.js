'use strict';

var service = require('feathers-sequelize');
var content = require('./content-model');
var hooks = require('./hooks');

module.exports = function(){
  var app = this;

  var options = {
    Model: content(app.get('sequelize')),
    paginate: {
      default: 5,
      max: 25
    }
  };

  // Initialize our service with any options it requires
  app.use('/contents', service(options));

  // Get our initialize service to that we can bind hooks
  var contentService = app.service('/contents');

  // Set up our before hooks
  contentService.before(hooks.before);

  // Set up our after hooks
  contentService.after(hooks.after);
};
