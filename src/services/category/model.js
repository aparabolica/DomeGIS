'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var layerGroup = sequelize.define('layerGroups', {
    id: {
      type: Sequelize.UUID,
      defaultValue: Sequelize.UUIDV1,
      primaryKey: true
    },
    name: {
      type: Sequelize.STRING,
      required: true
    },
    description: {
      type: Sequelize.TEXT
    },
    layers: {
      type: Sequelize.ARRAY(Sequelize.JSON)
    }
  });

  return layerGroup;
};
