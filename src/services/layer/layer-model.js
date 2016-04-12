'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var layer = sequelize.define('layers', {
    name: { type: Sequelize.STRING, required: true}
  }, {
    freezeTableName: true,
    classMethods: {
      associate: function(models){
        layer.belongsTo(models.contents);
        layer.hasMany(models.views);
      }
    }
  });

  return layer;
};
