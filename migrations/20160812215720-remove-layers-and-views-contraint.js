'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query("ALTER TABLE \"views\" DROP CONSTRAINT \"views_layerId_fkey\";");
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query("ALTER TABLE \"views\" ADD CONSTRAINT \"views_layerId_fkey\" FOREIGN KEY (\"layerId\") REFERENCES public.layers (\"id\") MATCH SIMPLE ON DELETE CASCADE ON UPDATE CASCADE;");
  }
};
