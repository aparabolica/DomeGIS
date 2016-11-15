'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    queryInterface.changeColumn('layers', 'type', {
      type: Sequelize.STRING,
      required: true
    });
  },

  down: function (queryInterface, Sequelize) {
    // return queryInterface.sequelize.query("ALTER TABLE \"layers\" ALTER COLUMN \"type\" TYPE enum_layers_type USING type::enum_layers_type;");
  }
};
