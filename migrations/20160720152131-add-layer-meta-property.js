'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('layers', 'metadata', Sequelize.JSON )
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('layers', 'metadata')
  }
};
