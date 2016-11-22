'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var map = sequelize.define('map', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true
    },
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT
    },
    baseLayer: {
      type: Sequelize.STRING
    },
    language: {
      type: Sequelize.STRING
    },
    scrollWhellZoom: {
      type: Sequelize.BOOLEAN
    },
    widgets: {
      type: Sequelize.JSON
    }
  }, {
    classMethods: {
      associate: function(models) {
        map.hasMany(models.layers);
      }
    }
  });

  return map;
};
