'use strict';
var content = require('./content');
var tile = require('./tile');
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
  app.configure(tile);
};
