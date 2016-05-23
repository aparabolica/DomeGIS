'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var user = sequelize.define('users', {
    name: {
      type: Sequelize.STRING,
      allowNull: false
    },
    email: {
      type: Sequelize.STRING,
      allowNull: false,
      unique: true
    },
    password: {
      type: Sequelize.STRING,
      allowNull: false
    },
    role: {
      type: Sequelize.ENUM('admin', 'editor'),
      defaultValue: 'editor'
    }
  }, {
    freezeTableName: true
  });

  return user;
};
