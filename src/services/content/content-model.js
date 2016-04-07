'use strict';

// content-model.js - A sequelize model
//
// See http://docs.sequelizejs.com/en/latest/docs/models-definition/
// for more of what you can do here.

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var content = sequelize.define('contents', {
    _id: { type: Sequelize.STRING, primaryKey: true},
    name: { type: Sequelize.STRING, required: true},
    title: { type: Sequelize.STRING, required: true},
    type: { type: Sequelize.STRING, required: true},
    description: { type: Sequelize.STRING},
    url: {
      type: Sequelize.STRING,
      validate: {
        isUrl: true
      }
    },
    tags: { type: Sequelize.ARRAY(Sequelize.TEXT) },
    modifiedAt: { type: Sequelize.DATE, required: true}
  }, {
    freezeTableName: true
  });

  content.sync({ force: true, match: /_test$/ });

  return content;
};