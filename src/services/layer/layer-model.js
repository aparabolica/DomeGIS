'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var layer = sequelize.define('layers', {
    id: { type: Sequelize.STRING, primaryKey: true},
    contentId: { type: Sequelize.STRING },  
    index: { type: Sequelize.INTEGER},
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
