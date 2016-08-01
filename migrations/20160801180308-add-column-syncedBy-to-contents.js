'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('contents', 'syncedBy', Sequelize.INTEGER )
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('contents', 'syncedBy');
  }
};
