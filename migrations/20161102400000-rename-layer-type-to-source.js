'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.renameColumn('layers', 'type', 'source');
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.renameColumn('layers', 'source', 'type');
  }
};
