'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('analyses', 'dataTemplate', {
      type: Sequelize.TEXT
    });
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('analyses', 'dataTemplate')
  }
};
