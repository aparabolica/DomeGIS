'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var analysis = sequelize.define('analysis', {
    title: {
      type: Sequelize.STRING,
      allowNull: false
    },
    description: {
      type: Sequelize.TEXT
    },
    sql: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    resultText: {
      type: Sequelize.TEXT
    },
    layerId: {
      type: Sequelize.STRING
    }
  });

  return analysis;
};
