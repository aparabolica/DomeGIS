'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('views', 'type', {
      type: Sequelize.STRING,
      required: true
    });
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('views', 'type')
  }
};
