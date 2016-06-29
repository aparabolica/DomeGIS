'use strict';

module.exports = {
  up: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query("ALTER TABLE \"layers\" ADD CONSTRAINT \"layers_contentId_fkey\" FOREIGN KEY (\"contentId\") REFERENCES public.contents (\"id\") MATCH SIMPLE ON DELETE CASCADE ON UPDATE CASCADE;");
  },

  down: function (queryInterface, Sequelize) {
    return queryInterface.sequelize.query("ALTER TABLE \"layers\" DROP CONSTRAINT \"layers_contentId_fkey\";");
  }
};
