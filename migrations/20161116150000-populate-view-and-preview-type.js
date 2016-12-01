'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query("UPDATE \"views\" SET type='vector'; UPDATE \"previews\" SET type='vector';");
  },

  down: function (queryInterface, Sequelize) {
  }
};
