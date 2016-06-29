'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.createTable('contents', {
        id: {
          type: Sequelize.STRING,
          primaryKey: true
        },
        name: {
          type: Sequelize.STRING,
          required: true
        },
        title: {
          type: Sequelize.STRING,
          required: true
        },
        type: {
          type: Sequelize.STRING,
          required: true
        },
        description: { type: Sequelize.TEXT},
        url: {
          type: Sequelize.STRING(2000),
          validate: {
            isUrl: true
          }
        },
        tags: {
          type: Sequelize.ARRAY(Sequelize.TEXT)
        },
        createdAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        updatedAt: {
          type: Sequelize.DATE,
          allowNull: false
        },
        modifiedAt: {
          type: Sequelize.DATE,
          required: true
        }
      }
    );
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.dropTable('contents');
  }
};
