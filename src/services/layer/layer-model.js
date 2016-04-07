'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var layer = sequelize.define('layers', {
    id: { type: Sequelize.STRING, primaryKey: true},
    name: { type: Sequelize.STRING, required: true}
  }, {
    freezeTableName: true
  });

  layer.sync();

  return layer;
};
