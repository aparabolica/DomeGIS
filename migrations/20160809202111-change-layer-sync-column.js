'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('layers', 'sync', Sequelize.JSON );
  },
  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('layers', 'sync');
  }
};
