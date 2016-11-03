'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.addColumn('views', 'expiresAt', Sequelize.DATE )
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.removeColumn('views', 'expiresAt')
  }
};
