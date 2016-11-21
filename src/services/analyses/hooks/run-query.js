'use strict';

module.exports = function(hook) {
  var sequelize = hook.app.get('sequelize_readonly');
  var Analyses = hook.app.service('analyses');
  var query;

  function getQuery() {
    return new Promise(function(resolve, reject){
      if (hook.method == 'create') {
        query = hook.data.query;
        resolve();
      } else {
        // load query from database
        Analyses.get(hook.id).then(function(analysis){
          query = analysis.query;
          resolve();
        }).catch(reject);
      }
    });
  }

  function executeQuery() {
    return new Promise(function(resolve, reject){
      sequelize.query(query).then(function(results){
        hook.data.results = results[0];
        resolve();
      }).catch(reject);
    });
  }

  return getQuery()
    .then(executeQuery);
}
