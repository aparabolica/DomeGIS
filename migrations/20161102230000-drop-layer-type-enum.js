'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query("DROP TYPE IF EXISTS \"enum_layers_type\" CASCADE;");
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query("CREATE TYPE \"enum_layers_type\" AS ENUM ('arcgis', 'derived');");
  }
};
