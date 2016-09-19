'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('views', 'expiresAt', Sequelize.DATE )
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('views', 'expiresAt')
  }
};
