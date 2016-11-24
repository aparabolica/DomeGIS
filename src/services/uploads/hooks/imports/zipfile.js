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
  var unzipPath = hook.params.file.path + '.zip/';
  var layer = _.clone(hook.result.layer);
  var Layers = hook.app.service('layers');

  function unzipFile(){
    var cmd = 'unzip -o -d ' + unzipPath + ' ' + filePath;
    console.log('unzipFile');
    return promiseFromChildProcess(exec(cmd));
  }

  function zipToPostgresql(){
    var cmd = 'ogr2ogr --config PG_USE_COPY YES -f "PostgreSQL" "PG:user=domegis dbname=domegis " "' + unzipPath + '" -t_srs "EPSG:3857" -lco GEOMETRY_NAME=geometry -lco FID=gid -lco PRECISION=no -nlt PROMOTE_TO_MULTI -nln ' + layer.id + ' -overwrite'
    // var cmd = 'ogr2ogr -f PostgreSQL PG:"dbname=domegis user=domegis ' + unzipPath;
    console.log(cmd);
    console.log('zipToPostgresql');
    return promiseFromChildProcess(exec(cmd));
  }

  function updateLayerMeta(){
    return new Promise(function (resolve, reject){
       var sequelize = hook.app.get('sequelize');
       var query = "UPDATE layers SET extents = (SELECT ST_Extent(ST_Transform(geometry,4326)) FROM \""+ layer.id +"\"), \"featureCount\" = (select count(*) from \""+layer.id+"\"), \"geometryType\" = (select GeometryType(geometry) from \""+layer.id+"\" LIMIT 1) WHERE (layers.id =  '"+ layer.id +"');"
       + "ALTER TABLE \""+layer.id+"\" RENAME COLUMN \"gid\" to \"domegis_id\";"
       + "GRANT SELECT ON \""+layer.id+"\" TO domegis_readonly;";
       sequelize.query(query).then(function(result){
         resolve();
       }).catch(reject);
    });
  }

  function updateLayerStatus(err){
    console.log('updateLayerStatus');
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
      sync: layer.sync
    }).catch(function(err){
      log(layer.id + ' error saving raster import status');
    });
  }

  unzipFile()
    .then(zipToPostgresql)
    .then(updateLayerMeta)
    .then(updateLayerStatus)
    .catch(updateLayerStatus);

  return hook;

}
