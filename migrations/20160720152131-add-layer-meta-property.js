'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('layers', 'metadata', Sequelize.JSON )
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('layers', 'metadata')
  }
};
