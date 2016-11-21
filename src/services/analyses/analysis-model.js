'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var analysis = sequelize.define('analysis', {
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
    query: {
      type: Sequelize.TEXT,
      allowNull: false
    },
    dataTemplate: {
      type: Sequelize.TEXT
    },
    results: {
      type: Sequelize.JSON
    }
  }, {
    timestamps: true,
    updatedAt: 'executedAt'
  });

  return analysis;
};
