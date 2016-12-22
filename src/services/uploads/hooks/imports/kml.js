'use strict';

var _ = require('underscore');
var Promise = require('bluebird');
var exec = require('child_process').exec;

// promise helper
function promiseFromChildProcess(child) {
    return new Promise(function (resolve, reject) {
        child.addListener("error", reject);
        child.addListener("exit", resolve);
    });
}

module.exports = function(hook) {

  var filePath = hook.params.file.path;
  var layer = _.clone(hook.result.layer);
  var Layers = hook.app.service('layers');
  var fields = {};


  function kmlToPostgreSQL(){
    var cmd = 'ogr2ogr --config PG_USE_COPY YES -f "PostgreSQL" "PG:user=domegis dbname=domegis " "' + filePath + '" -t_srs "EPSG:3857" -lco GEOMETRY_NAME=geometry -lco FID=gid -lco PRECISION=no -nlt PROMOTE_TO_MULTI -nln ' + layer.id + ' -overwrite';
    return promiseFromChildProcess(exec(cmd));
  }

  function updateLayerMeta(){
    return new Promise(function (resolve, reject){
       var sequelize = hook.app.get('sequelize');
       var geometryType = 'SELECT array_to_string(array_agg(distinct GeometryType(geometry)), \',\') FROM "' + layer.id + '"';
       var query = "UPDATE layers SET "
       + "extents = (SELECT ST_Extent(ST_Transform(geometry,4326)) FROM \""+ layer.id +"\"), "
       + '"geometryType" = (' + geometryType + '),'
       + "\"featureCount\" = (select count(*) from \""+layer.id+"\") WHERE (layers.id =  '"+ layer.id +"');"
       + "ALTER TABLE \""+layer.id+"\" RENAME COLUMN \"gid\" to \"domegis_id\";"
       + "GRANT SELECT ON \""+layer.id+"\" TO domegis_readonly;";
       sequelize.query(query).then(function(result){
         resolve();
       }).catch(reject);
    });
  }

  function getFields() {
    return new Promise(function(resolve, reject){
      var sequelize = hook.app.get('sequelize');
      var query = "select column_name as name, data_type as type, character_maximum_length as length from INFORMATION_SCHEMA.COLUMNS where table_name = '" + layer.id + "';"

      sequelize.query(query).then(function(result){

        // prepare fields
        fields = _.map(result[0], function(field) {

          // translate field type
          switch (field.type) {
            case "character varying":
              field.type = "esriFieldTypeString"
              break;
            case "integer":
              field.type = "esriFieldTypeInteger"
              break;
            case "double":
              field.type = "esriFieldTypeDouble"
              break;
          }

          // localization
          field.title = {
            "en": field.name,
            "es": field.name,
            "pt": field.name
          }
          return field;
        });

        // discard geometry
        fields = _.reject(fields, function(field){ return (field.type == 'USER-DEFINED') });

        resolve();
      }).catch(function(err){
        console.log('err', err);
      });
    });
  }

  function updateLayerStatus(err){
    if (err) {
      console.log(err);
      layer.sync.status = 'error';
      layer.sync.message = err.message;
    } else {
      layer.sync.status = 'imported';
    }

    layer.sync.finishedAt = Date.now();

    // update layer
    Layers.patch(layer.id, {
      metadata: layer.metadata,
      fields: fields,
      sync: layer.sync
    }).catch(function(err){
      log(layer.id + ' error saving layer status');
    });
  }

  kmlToPostgreSQL()
    .then(updateLayerMeta)
    .then(getFields)
    .then(updateLayerStatus)
    .catch(updateLayerStatus);

  return hook;
}
