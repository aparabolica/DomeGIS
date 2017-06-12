'use strict';

var service = require('feathers-sequelize');
var layerGroupModel = require('./model');
var hooks = require('./hooks');

module.exports = function(){
  var app = this;

  var options = {
    Model: layerGroupModel(app.get('sequelize' )),
    paginate: {
      default: 10,
      max: 25
    }
  };

  // Initialize our service with any options it requires
  app.use('/layer-groups', service(options));

  // Get our initialize service to that we can bind hooks
  var layerGroupService = app.service('/layer-groups');

  // Set up our before hooks
  layerGroupService.before(hooks.before);

  // Set up our after hooks
  layerGroupService.after(hooks.after);
};
