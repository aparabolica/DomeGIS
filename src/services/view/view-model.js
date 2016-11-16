'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var view = sequelize.define('views', {
    id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV1, primaryKey: true},
    type: { type: Sequelize.ENUM('vector', 'raster'), required: true, defaultValue: 'vector'},
    name: { type: Sequelize.STRING, required: true},
    fields: { type: Sequelize.ARRAY(Sequelize.STRING), defaultValue: []},
    style: { type: Sequelize.JSON, required: true},
    cartocss: { type: Sequelize.TEXT, required: true},
    layergroupId: { type: Sequelize.STRING },
    creatorId: { type: Sequelize.INTEGER },
    expiresAt: { type: Sequelize.DATE }
  }, {
    classMethods: {
      associate: function(models){
        view.belongsTo(models.layers, {
          constraints: false
        });
      }
    }
  });

  return view;
};
