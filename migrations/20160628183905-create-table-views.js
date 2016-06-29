'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('views', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV1,
        primaryKey: true
      },
      name: {
        type: Sequelize.STRING,
        required: true
      },
      fields: {
        type: Sequelize.ARRAY(Sequelize.STRING),
        defaultValue: []
      },
      style: {
        type: Sequelize.JSON,
        required: true
      },
      cartocss: {
        type: Sequelize.TEXT,
        required: true
      },
      layergroupId: {
        type: Sequelize.STRING
      },
      layerId: {
        type: Sequelize.STRING
      },
      creatorId: {
        type: Sequelize.INTEGER
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
    return queryInterface.dropTable('views');
  }
};
