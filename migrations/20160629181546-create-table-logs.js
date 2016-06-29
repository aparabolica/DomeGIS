'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('logs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      level: {
        type: Sequelize.STRING
      },
      message: {
        type: Sequelize.STRING
      },
      meta: {
        type: Sequelize.JSON
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('logs');
  }
};
