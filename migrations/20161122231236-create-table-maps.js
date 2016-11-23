'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('maps', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        primaryKey: true
      },
      title: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT
      },
      baseLayer: {
        type: Sequelize.STRING
      },
      language: {
        type: Sequelize.STRING
      },
      scrollWhellZoom: {
        type: Sequelize.BOOLEAN
      },
      widgets: {
        type: Sequelize.ARRAY(Sequelize.JSON)
      },
      layers: {
        type: Sequelize.ARRAY(Sequelize.JSON)
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('maps');
  }
};
