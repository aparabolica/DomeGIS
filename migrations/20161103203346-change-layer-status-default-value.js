'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('layers', 'status', {
      type: Sequelize.STRING
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.changeColumn('layers', 'status', {
      type: Sequelize.STRING,
      defaultValue: 'syncing'
    });
  }
};
