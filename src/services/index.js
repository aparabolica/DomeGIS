'use strict';
var Sequelize = require('sequelize');
var user = require('./user');
var content = require('./content');
var layer = require('./layer');
var view = require('./view');
var authentication = require('./authentication');

module.exports = function() {
  var app = this;

  var sequelize = new Sequelize(app.get('postgres'), {
    dialect: 'postgres',
    logging: false
  });
  app.set('sequelize', sequelize);

  app.configure(authentication);
  app.configure(user);
  app.configure(content);
  app.configure(layer);
  app.configure(view);

  // Setup relationships
  var models = sequelize.models;
  Object.keys(models)
   .map(function(name) { return models[name] })
   .filter(function(model) { return model.associate })
   .forEach(function(model) { return  model.associate(models) } );

  sequelize.sync();

  // disable windshaft when testing
  if (process.env.NODE_ENV != 'test') {
    app.configure(require('./tiles'));
  }
};
