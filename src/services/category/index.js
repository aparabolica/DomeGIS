"use strict";

var service = require("feathers-sequelize");
var categoryModel = require("./models/category");
var layerCategoryModel = require("./models/layerCategory");
var hooks = require("./hooks");

module.exports = function() {
  var app = this;

  // define association model
  layerCategoryModel(app.get("sequelize"));

  var options = {
    Model: categoryModel(app.get("sequelize")),
    paginate: {
      default: 10,
      max: 25
    }
  };

  // Initialize our service with any options it requires
  app.use("/categories", service(options));

  // Get our initialize service to that we can bind hooks
  var categoryService = app.service("/categories");

  // Set up our before hooks
  categoryService.before(hooks.before);

  // Set up our after hooks
  categoryService.after(hooks.after);
};
