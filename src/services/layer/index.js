'use strict';

var _ = require('underscore');
var async = require('async');
var service = require('feathers-sequelize');
var layer = require('./layer-model');
var hooks = require('./hooks');

module.exports = function(){
  var app = this;

  var options = {
    Model: layer(app.get('sequelize')),
    paginate: {
      default: 5,
      max: 25
    },
    events: ['syncFinish', 'custom']
  };

  var LayerService = service(options);

  LayerService.events = ['syncFinish', 'syncProgress'];

  var sequelize = app.get('sequelize');
  var sequelize_readonly = app.get('sequelize_readonly');

  /*
   * Derived layers preview
   */
  app.use('/layers/preview', function(req, res, next) {
    var sql = req.query.sql;
    if (!sql)
      return res.status(400).json({message: 'Missing SQL query'})
    else
      sequelize_readonly
        .query(sql)
        .then(function(queryResult) {


          var records = queryResult[0];
          var fields = queryResult[1].fields;

          // check is results are valid
          if (records.length == 0)
            return res.status(400).json({message: 'Query returned no records.'});
          else if (fields.length == 0)
            return res.status(400).json({message: 'Query returned no fields.'});
          else {

            var geometryFields = _.filter(fields, function(field){
              return (field.name == 'geometry');
            });

            // top results;
            queryResult[0] = _.first(queryResult[0], 50);

            // remove geometries
            queryResult[0] = _.map(queryResult[0], function(row){
              delete row.geometry;
              return row;
            });

            return res.json(queryResult);
          }
        })
        .catch(function(err) {

          // query is invalid
          return res.status(500).json({message: err.message});
        });
  });

  /*
   * Get feature with extents
   */
  app.use('/layers/:id/feature/:featureId', function(req, res, next) {

    var Layers = app.service('layers');
    var layerId = req.params.id;
    var featureId = req.params.featureId;

    Layers.get(layerId).then(function(layer) {

      if (!layer) return res.sendStatus(404);

      var _from = 'FROM \"' + layerId + '\" as t WHERE t.domegis_id = ' + parseInt(featureId);

      var select = 'SELECT * ' + _from;
      var extentSelect = 'SELECT ST_Extent(ST_Transform(geometry,4326)) ' + _from;

      sequelize
        .query(select)
        .then(function(queryResult) {
          if(queryResult[0] && queryResult[0].length) {
            var feature = queryResult[0][0];
            sequelize.query(extentSelect)
              .then(function(extent) {
                delete feature.geometry;
                feature.extents = extent[0][0].st_extent;
                res.json(feature);
              })
              .catch(function(err) {
                res.json(feature);
              });
          } else {
            res.sendStatus(404);
          }
        })
        .catch(function(err) {
          console.log(err);
          res.status(500).json({ error: 'error while finding feature' });
        });
    });
  });


  /*
   * Feature search
   */
  app.use('/layers/:id/search', function(req, res, next) {
     var Layers = app.service('layers');
     var layerId = req.params.id;
     var term = req.query.term;

     var results = { features: [] };

     Layers.get(layerId).then(function(layer){
       if (!layer) return res.sendStatus(404);

       var where = [];
       _.each(layer.fields, function(field){
         if (field.type == 'esriFieldTypeString') {
           where.push("(t.\"" + field.name + "\" ILIKE '%" + term + "%')")
         };
       });

       if (where.length > 0) {
         var query = 'SELECT * FROM \"' + layerId + '\" as t WHERE ' + where.join(' OR ');
         sequelize.query(query)
           .then(function(queryResult){
             queryResult[0].forEach(function(item){
               item.layerId = layer.id;
               results.features.push(item);
             });
             res.json(results);
           }).catch(function(err){
             res.status(500).json({ error: 'error while searching in features' });
           });
       } else res.json(results);
     }).catch(function(err){
       res.status(500).json(err);
     });
   });

  /*
   * Distinct search
   */

  app.use('/layers/:id/values', function(req, res, next) {
    var Layers = app.service('layers');
    var layerId = req.params.id;
    var term = req.query.term;

    var results = { features: [] };


    Layers.get(layerId).then(function(layer){
      if (!layer) return res.sendStatus(404);
      if (!layer.featureCount) return res.status(500).json({message: 'Layer has no features.'});

      var fields = [];
      async.eachSeries(layer.fields, function(field, doneEach){
        if (field.name == 'OBJECTID') return doneEach();
        var query = 'SELECT DISTINCT \"' + field.name +'\" FROM \"' + layerId + '\" ORDER BY \"' + field.name +'\";';
        sequelize.query(query)
          .then(function(queryResult){

            fields.push({
              name: field.name,
              type: field.type,
              values: _.map(queryResult[0], function(result){
                return result[field.name];
              })
            })
            doneEach();
            return null;
        }).catch(function(err){
          doneEach(err);
        });
      }, function(err){
        if (err) return res.status(500).json(err);
        else res.json({fields: fields});
      });


    }).catch(function(err){
      res.status(500).json(err);
    });
  });

  // Initialize our service with any options it requires
  app.use('/layers', LayerService);

  // Get our initialize service to that we can bind hooks
  var layerService = app.service('/layers');

  // Set up our before hooks
  layerService.before(hooks.before);

  // Set up our after hooks
  layerService.after(hooks.after);

};
