'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.addColumn('previews', 'type', {
      type: Sequelize.STRING,
      required: true
    });
  },

  down: function (queryInterface, Sequelize) {
    queryInterface.removeColumn('previews', 'type')
  }
};
