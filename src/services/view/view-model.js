'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var view = sequelize.define('views', {
    name: { type: Sequelize.STRING, required: true},
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
