'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var layer = sequelize.define('layers', {
    id: { type: Sequelize.STRING, primaryKey: true},
    source: { type: Sequelize.ENUM('arcgis', 'derived', 'uploaded'), required: true},
    type: { type: Sequelize.ENUM('vector', 'raster'), required: true, defaultValue: 'vector'},
    query: { type: Sequelize.TEXT},
    contentId: { type: Sequelize.STRING },
    featureCount: { type: Sequelize.INTEGER},
    geometryType: { type: Sequelize.STRING },
    index: { type: Sequelize.INTEGER},
    name: { type: Sequelize.STRING, required: true},
    fields: { type: Sequelize.ARRAY(Sequelize.JSON) },
    extents: { type: Sequelize.STRING },
    url: { type: Sequelize.STRING, required: true },
    status: { type: Sequelize.STRING },
    metadata: { type: Sequelize.JSON, defaultValue: {} },
    sync: { type: Sequelize.JSON, defaultValue: {} }
  }, {
    classMethods: {
      associate: function(models){
        layer.belongsTo(models.contents);
        layer.hasMany(models.views, {
          constraints: false
        });
      }
    }
  });

  return layer;
};
