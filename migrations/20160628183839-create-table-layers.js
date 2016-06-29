'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('layers', {
        id: {
          type: Sequelize.STRING,
          primaryKey: true
        },
        type: {
          type: Sequelize.ENUM('arcgis', 'derived'),
          required: true
        },
        query: {
          type: Sequelize.TEXT
        },
        contentId: {
          type: Sequelize.STRING
        },
        featureCount: {
          type: Sequelize.INTEGER
        },
        geometryType: {
          type: Sequelize.STRING
        },
        index: {
          type: Sequelize.INTEGER
        },
        name: {
          type: Sequelize.STRING,
          required: true
        },
        fields: {
          type: Sequelize.ARRAY(Sequelize.JSON)
        },
        extents: {
          type: Sequelize.STRING
        },
        url: {
          type: Sequelize.STRING,
          required: true
        },
        status: {
          type: Sequelize.STRING,
          defaultValue: 'syncing'
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
    return queryInterface.dropTable('layers');
  }
};
