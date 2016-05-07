'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var view = sequelize.define('views', {
    id: { type: Sequelize.STRING, primaryKey: true},
    name: { type: Sequelize.STRING, required: true},
    layergroupId: { type: Sequelize.STRING },
    style: { type: Sequelize.JSON, required: true},
    cartocss: { type: Sequelize.TEXT, required: true}
  }, {
    freezeTableName: true,
    classMethods: {
      associate: function(models){
        view.belongsTo(models.layers);
      }
    }
  });

  return view;
};
