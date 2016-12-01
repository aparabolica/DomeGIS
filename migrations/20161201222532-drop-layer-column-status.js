'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('layers', 'status');
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('layers', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'syncing'
    });
  }
};
