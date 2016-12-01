'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query("UPDATE \"layers\" SET type='vector' WHERE source='arcgis';");
  },

  down: function (queryInterface, Sequelize) {
  }
};
