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

  function searchFeatures(term, doneSearchFeatures) {
    var results = { features: [] };

    Layers.find({}).then(function(layers){

      // get searchable fields for layer
      async.eachSeries(layers.data, function(layer, doneEach){
        var where = [];
        _.each(layer.fields, function(field){
          if (field.type == 'esriFieldTypeString') {
            where.push("(t.\"" + field.name + "\" ILIKE '%" + term + "%')")
          };
        });

        if (where.length > 0) {
          var query = 'SELECT * FROM \"' + layer.id + 's\" as t WHERE ' + where.join(' OR ');
          sequelize.query(query)
            .then(function(queryResult){
              queryResult[0].forEach(function(item){
                item.layerId = layer.id;
                results.features.push(item);
              });
              doneEach();
            }).catch(doneEach);
        } else doneEach();
      }, function(err){
        doneSearchFeatures(err, results);
      })
    });

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
          },
          function(doneEach) {
            searchFeatures(term, function(err, featuresResults){
              if (err) return reject(err);
              results = _.extend(results, featuresResults);
              doneEach();
            });
        }],
        function(err) {
          if (err) return reject(err);
          resolve(results);
        });

      });
    }
  });

};
