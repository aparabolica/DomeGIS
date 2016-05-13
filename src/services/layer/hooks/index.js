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
      return Sequelize.DATE;
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
    if (err) return done(err);

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
            hook.data.fields = properties.fields;
            hook.data.srid = properties.srid;
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
      if (err) data = {error: err};
      Layers.emit('syncFinish', data);
    }

    request({
      url: hook.data.url + '/query',
      qs: {
        returnGeometry: true,
        where: '1=1',
        outFields: '*',
        f: 'geojson'
      }
    }, function(err, res, body){
      if (err) return emitSyncFinishEvent(err);
      var data = JSON.parse(body);

      var schema = {
        geometry: { type: Sequelize.GEOMETRY(hook.data.geometryType, hook.data.srid) }
      }

      _.each(hook.data.fields, function(field){
        var fieldType = esriToSequelizeType(field.type);
        if (fieldType) schema[field.name] = { type: fieldType }
      });

      // create feature table
      var Features = sequelize.define(layerId, schema);
      sequelize.sync().then(function(){

        // insert features
        async.eachSeries(data.features, function(esriFeature, doneEach){

          esriFeature.geometry.crs = data.crs;
          var feature = {
            geometry: esriFeature.geometry
          }

          _.each(_.keys(esriFeature.properties), function(property){
            feature[property] = esriFeature.properties[property];
          });

          Features.create(feature).then(function(result){
            doneEach();
          }).catch(emitSyncFinishEvent);
        }, function(err){
          emitSyncFinishEvent(null, { id: layerId });
        });

      }).catch(emitSyncFinishEvent);

    });
  }],
  update: [],
  patch: [],
  remove: []
};
