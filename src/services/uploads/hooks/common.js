'use strict';

var Promise = require('bluebird');

var debug = require('debug');
var log = debug('domegis:service:uploads');

module.exports.promiseFromChildProcess = function(child) {
    return new Promise(function (resolve, reject) {
        child.addListener("error", reject);
        child.addListener("exit", resolve);
    });
}

module.exports.updateLayerStatus = function(err, hook){

  var layer = _.clone(hook.result.layer);
  var Layers = hook.app.service('layers');
  
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
    log(layer.id + ' error saving raster import status');
  });
}


module.exports.setExtent = function(hook){
  return new Promise(function (resolve, reject){
     var sequelize = hook.app.get('sequelize');
     var query = "UPDATE layers SET extents = (SELECT ST_Extent(ST_Transform(geometry,4326)) FROM \""+ layer.id +"\") WHERE (layers.id =  '"+ layer.id +"');";
     sequelize.query(query).then(function(result){
       resolve(hook);
     }).catch(reject);
  });
}
