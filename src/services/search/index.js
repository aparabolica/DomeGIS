'use strict';

var _ = require('underscore');
var async = require('async');

module.exports = function(){
  var app = this;

  var Layers = app.service('layers');

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

  function searchLayers(term, doneSearchLayers) {
    var results = { layers: [] };
    var query = "SELECT * FROM layers WHERE (name ILIKE '%"+term+"%') ";
    sequelize.query(query)
      .then(function(queryResult){
        queryResult[0].forEach(function(item){
          results.layers.push(item);
        });
        doneSearchLayers(null, results);
      }).catch(doneSearchLayers);
  }

  // Initialize service
  app.use('/search', {
    find: function(params) {
      return new Promise(function(resolve, reject){
        var results = {};
        var term = params.query.term;
        if (!term) return resolve(results);

        async.series([
          function(doneEach) {
            searchContents(term, function(err, contentResults){
              if (err) return reject(err);
              results = _.extend(results, contentResults);
              doneEach();
            });
          },
          function(doneEach) {
            searchLayers(term, function(err, layerResults){
              if (err) return reject(err);
              results = _.extend(results, layerResults);
              doneEach();
            });
          }
        ],
        function(err) {
          if (err) return reject(err);
          resolve(results);
        });

      });
    }
  });

};
