'use strict';

var Sequelize = require('sequelize');

module.exports = function(sequelize) {
  var content = sequelize.define('contents', {
    id: { type: Sequelize.STRING, primaryKey: true},
    name: { type: Sequelize.STRING, required: true},
    title: { type: Sequelize.STRING, required: true},
    type: { type: Sequelize.STRING, required: true},
    description: { type: Sequelize.TEXT},
    url: {
      type: Sequelize.STRING(2000), //http://stackoverflow.com/questions/417142/what-is-the-maximum-length-of-a-url-in-different-browsers#417184
      validate: {
        isUrl: true
      }
    },
    tags: { type: Sequelize.ARRAY(Sequelize.TEXT) },
    modifiedAt: { type: Sequelize.DATE, required: true}
  }, {
    classMethods: {
      associate: function(models){
        content.hasMany(models.layers);
      }
    }
  });

  return content;
};
