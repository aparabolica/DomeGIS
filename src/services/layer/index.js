'use strict';

var _ = require('underscore');
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
    }
  };

  // Initialize our service with any options it requires
  app.use('/layers', service(options));

  // Get our initialize service to that we can bind hooks
  var layerService = app.service('/layers');

  // Set up our before hooks
  layerService.before(hooks.before);

  // Set up our after hooks
  layerService.after(hooks.after);


  /*
   * Feature search
   */

   var sequelize = app.get('sequelize');
   var Layers = app.service('layers');

   app.use('/layers/:id/search', function(req, res, next) {
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
         var query = 'SELECT * FROM \"' + layerId + 's\" as t WHERE ' + where.join(' OR ');
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
};
