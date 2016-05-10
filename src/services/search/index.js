'use strict';

module.exports = function(){
  var app = this;

  var sequelize = app.get('sequelize');

  function searchContents(term, doneSearchContents) {
    var results = { contents: [] };
    var query = "SELECT * FROM contents WHERE (description ILIKE '%"+term+"%') OR (name ILIKE '%"+term+"%') ";
    sequelize.query(query)
      .then(function(queryResult){
        queryResult[0].forEach(function(item){
          results.contents.push(item);
        });
        doneSearchContents(null, results);
      }).catch(doneSearchContents);
  }

  // Initialize service
  app.use('/search', {
    find: function(params) {
      return new Promise(function(resolve, reject){
        searchContents(params.term, function(err, results){
          if (err) return reject(err);
          resolve(results);
        })
      });
    }
  });

};
