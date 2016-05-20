'use strict';

var _ = require('underscore');
var async = require('async');
var globalHooks = require('../../../hooks');
var hooks = require('feathers-hooks');
var request = require('request');
var Sequelize = require('sequelize');

function esriToSequelizeType(esriType) {
  switch (esriType) {
    case 'esriFieldTypeSmallInteger':
      return Sequelize.INTEGER;
      break;
    case 'esriFieldTypeInteger':
      return Sequelize.BIGINT;
      break;
    case 'esriFieldTypeSingle':
      return Sequelize.FLOAT;
      break;
    case 'esriFieldTypeDouble':
      return Sequelize.DOUBLE;
      break;
    case 'esriFieldTypeString':
      return Sequelize.STRING;
      break;
    case 'esriFieldTypeDate':
      return Sequelize.DATE;
      break;
    case 'esriFieldTypeOID':
      return Sequelize.BIGINT;
      break;
    case 'esriFieldTypeGeometry':
      return Sequelize.GEOMETRY;
      break;
    case 'esriFieldTypeBlob':
      return Sequelize.BLOB;
      break;
    case 'esriFieldTypeGUID':
      return Sequelize.STRING;
      break;
    case 'esriFieldTypeGlobalID':
      return Sequelize.STRING;
      break;
    case 'esriFieldTypeXML':
      return Sequelize.TEXT;
      break;
    default:
      return null;
  }
}

function dropLayer(sequelize, layerId, doneResetLayer) {
  sequelize.query('DROP TABLE IF EXISTS \"'+layerId+'s\"')
    .then(function(results){
      doneResetLayer();
    }).catch(doneResetLayer);
}

function getLayerProperties(url, doneGetLayerProperties) {
  request({
    url: url,
    qs: {
      f: 'json'
    }
  }, function(err, res, body){
    if (err) return doneGetLayerProperties(err);

    var properties = JSON.parse(body);

    switch (properties.geometryType) {
      case "esriGeometryPoint":
        properties.geometryType = 'POINT'
        break;
      case "esriGeometryMultipoint":
        properties.geometryType = 'MULTIPOINT'
        break;
      case "esriGeometryLine":
        properties.geometryType = 'LINE'
        break;
      case "esriGeometryPolyline":
        properties.geometryType = 'LINESTRING'
        break;
      case "esriGeometryPolygon":
        properties.geometryType = 'MULTIPOLYGON'
        break;
    }

    properties.srid = properties.extent.spatialReference.latestWkid || properties.extent.spatialReference.wkid;

    doneGetLayerProperties(null, properties);
  });
}

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [function(hook){
    return new Promise(function(resolve, reject){

      var sequelize = hook.app.get('sequelize');

      async.series([
        function(doneStep){
          dropLayer(sequelize, hook.data.id, function(err){
            if (err) return reject(err);
            else doneStep();
          })
        },
        function(doneStep){
          getLayerProperties(hook.data.url, function(err, properties){
            if (err) return reject(err);
            hook.data.geometryType = properties.geometryType;
            hook.data.fields = _.map(properties.fields, function(field) {
              field.title = {
                "en": field.name,
                "es": field.name,
                "pt": field.name
              }
              return field;
            });
            resolve();
          })
        }
      ]);
    });
  }],
  update: [],
  patch: [],
  remove: []
};

exports.after = {
  all: [],
  find: [],
  get: [],
  create: [function(hook){
    var Layers = hook.app.service('layers');
    var sequelize = hook.app.get('sequelize');
    var layerId = hook.data.id;

    Layers.emit('created', hook.data);

    function emitSyncFinishEvent(err, data) {
      if (!data) data = {};
      if (err) {
        console.log('error in sync');
        console.log(err);
        data = {error: err}
      };
      Layers.emit('syncFinish', data);
    }

    request({
      url: hook.data.url + '/query',
      qs: {
        returnGeometry: true,
        where: '1=1',
        outSR: 4326,
        outFields: '*',
        f: 'geojson'
      }
    }, function(err, res, body){
      if (err) return emitSyncFinishEvent(err);
      var data = JSON.parse(body);


      // if layers is empty, don't create feature table
      if (data.features == 0) {
        Layers.update({_id: layerId}, {$set:{
          featureCount: 0
        }}).then(function(result){
          emitSyncFinishEvent(null, {
            id: layerId,
            featureCount: 0
          })
        });

      // layer is not empty, sync
      } else {

        var postgisType = data.features[0]['geometry']['type'];

        if (postgisType == 'Polygon') postgisType = 'MultiPolygon';

        var schema = {
          geometry: { type: Sequelize.GEOMETRY(postgisType, 4326) }
        }

        _.each(hook.data.fields, function(field){
          var fieldType = esriToSequelizeType(field.type);
          if (fieldType) schema[field.name] = { type: fieldType }
        });

        // drop table if exists
        console.log('DROP TABLE IF EXISTS \"'+layerId+'s\";');
        sequelize.query('DROP TABLE IF EXISTS \"'+layerId+'s\";').then(function(){
          // create feature table
          var Features = sequelize.define(layerId, schema);
          sequelize.sync().then(function(){

            // insert features
            async.eachSeries(data.features, function(esriFeature, doneEach){

              // set srid on feature (because of PostGIS)
              esriFeature.geometry.crs = data.crs;

              // create fake MultiPolygon if needed
              if (postgisType == 'MultiPolygon' && esriFeature.geometry.type == 'Polygon') {
                esriFeature.geometry.type = 'MultiPolygon';
                esriFeature.geometry.coordinates = [esriFeature.geometry.coordinates];
              }

              _.each(_.keys(esriFeature.properties), function(property){
                esriFeature[property] = esriFeature.properties[property];
              });

              Features.create(esriFeature).then(function(result){
                doneEach();
              }).catch(emitSyncFinishEvent);
            }, function(err){
              if (err) return emitSyncFinishEvent(err);
              var query = "UPDATE layers SET extents = (SELECT ST_Extent(ST_Transform(geometry,4326)) FROM \""+ layerId +"s\"), \"featureCount\" = " + data.features.length + "  WHERE (layers.id =  '"+ layerId +"');"
              sequelize.query(query).then(function(result){
                emitSyncFinishEvent(null, { id: layerId });
              }).catch(emitSyncFinishEvent);
            });
          }).catch(emitSyncFinishEvent);
        }).catch(emitSyncFinishEvent);
      }
    });
  }],
  update: [],
  patch: [],
  remove: []
};
