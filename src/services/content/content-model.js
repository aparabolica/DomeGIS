'use strict';

// content-model.js - A sequelize model
//
// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var content = sequelize.define('contents', {
    text: {
      type: Sequelize.STRING,
      allowNull: false
    }
  }, {
    freezeTableName: true
  });

  content.sync();

  return content;
};
