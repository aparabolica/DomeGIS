'use strict';
var Sequelize = require('sequelize');
var user = require('./user');
var content = require('./content');
var layer = require('./layer');
var view = require('./view');
var search = require('./search');
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
  app.configure(search);

  // Setup relationships
  var models = sequelize.models;
  Object.keys(models)
   .map(function(name) { return models[name] })
   .filter(function(model) { return model.associate })
   .forEach(function(model) { return  model.associate(models) } );

  sequelize.sync({force:true});


  // init admin user
  var Users = app.service('users');
  Users.find({$limit: 1}).then(function(users){
    if (users.total == 0) {
      Users.create({
        name: "First Admin",
        email: "admin@domegis",
        password: "domegis",
        role: "admin"
      }).then(function(){
        console.log('First admin user created sucessfully, please change its password.');
      })
    }
  }).catch(function(err){
    console.log('Error creating first admin user:');
    console.log(err);
  });

  // disable windshaft when testing
  if (process.env.NODE_ENV != 'test') {
    app.configure(require('./tiles'));
  }
};
