'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('layers', 'type', {
      type: Sequelize.STRING,
      required: true
    });
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('layers', 'type')
  }
};
