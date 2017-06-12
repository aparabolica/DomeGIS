'use strict';
var Sequelize = require('sequelize');

module.exports = function() {
  var app = this;

  // sequelize with full access
  var sequelize = new Sequelize(app.get('sequelize'), {
    dialect: 'postgres',
    logging: false
  });
  app.set('sequelize', sequelize);

  // sequelize with read only
  var sequelize_readonly = new Sequelize(app.get('sequelize_readonly'), {
    dialect: 'postgres',
    logging: false
  });
  app.set('sequelize_readonly', sequelize_readonly);

  app.configure(require('./authentication'));
  app.configure(require('./user'));
  app.configure(require('./uploads'));
  app.configure(require('./layer'));
  app.configure(require('./layer-groups'));
  app.configure(require('./content'));
  app.configure(require('./preview'));
  app.configure(require('./view'));
  app.configure(require('./analyses'));
  app.configure(require('./maps'));

  // services after this point are avoided to speed up tests
  if (process.env.NODE_ENV != 'test') {
    app.configure(require('./search'));
    app.configure(require('./logging'));
    app.configure(require('./verify-reset'));
    app.configure(require('./tiles'));

    var feathersLogger = require('feathers-logger');
    var Logger = require('../lib/logger');
    var logger = new Logger({
      app: app,
      sequelize: sequelize
    });
    app.configure(feathersLogger(logger));
  }

  // Setup relationships
  var models = sequelize.models;
  Object.keys(models)
   .map(function(name) { return models[name] })
   .filter(function(model) { return model.associate })
   .forEach(function(model) { return  model.associate(models) } );

  // Bootstrap DB
  sequelize.sync().then(function(){

    // init admin user
    var Users = app.service('users');
    Users.find({$limit: 1}).then(function(users){

      if (users.total == 0) {
        Users.create({
          name: "First Admin",
          email: "admin@domegis",
          password: "domegis",
          roles: ["admin", "editor"]
        }).then(function(){
          console.log('First admin user created sucessfully, please change its password.');
        }).catch(function(err){
          console.log('Couldn\'t create first user!');
          console.log(err);
        })
      }
    }).catch(function(err){
      console.log('Error creating first admin user:');
      console.log(err);
    });
  });
};
