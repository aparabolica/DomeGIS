'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('contents', 'syncedBy', Sequelize.INTEGER )
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('contents', 'syncedBy');
  }
};
