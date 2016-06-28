'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var user = sequelize.define('users', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true
    },
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
    roles: {
      type: Sequelize.ARRAY(Sequelize.STRING)
    }
  });

  return user;
};
