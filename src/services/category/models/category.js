"use strict";

var Sequelize = require("sequelize");

module.exports = function(sequelize) {
  var category = sequelize.define(
    "categories",
    {
      name: {
        type: Sequelize.STRING,
        required: true
      },
      description: {
        type: Sequelize.TEXT
      }
    },
    {
      classMethods: {
        associate: function(models) {
          category.belongsToMany(models.layers, {
            through: models.layerCategories
          });
        }
      }
    }
  );

  return category;
};
