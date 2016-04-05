'use strict';
var content = require('./content');
var tilesNew = require('./tiles-new');
var authentication = require('./authentication');
var user = require('./user');
var Sequelize = require('sequelize');

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

  if (process.env.NODE_ENV != 'test') {
    app.configure(tilesNew);
  }
};
