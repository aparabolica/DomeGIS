'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var view = sequelize.define('views', {
    id: { type: Sequelize.STRING, primaryKey: true},
    name: { type: Sequelize.STRING, required: true},
    style: { type: Sequelize.STRING, required: true}
  }, {
    freezeTableName: true
  });

  view.sync();

  return view;
};
