'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query("ALTER TABLE \"previews\" ADD CONSTRAINT \"previews_layerId_fkey\" FOREIGN KEY (\"layerId\") REFERENCES public.layers (\"id\") MATCH SIMPLE ON DELETE CASCADE ON UPDATE CASCADE;");
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query("ALTER TABLE \"previews\" DROP CONSTRAINT \"previews_layerId_fkey\";");
  }
};
