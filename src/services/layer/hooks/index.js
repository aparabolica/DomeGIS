'use strict';

var _ = require('underscore');
var globalHooks = require('../../../hooks');
var hooks = require('feathers-hooks');
var request = require('request');
var Sequelize = require('sequelize');
var async = require('async');

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

exports.before = {
  all: [],
  find: [],
  get: [],
  create: [function(hook){
    return new Promise(function(resolve, reject){
      request({
        url: hook.data.url,
        qs: {
          f: 'json'
        }
      }, function(err, res, body){
        if (err) return reject(err);

        var metadata = JSON.parse(body);

        switch (metadata.geometryType) {
          case "esriGeometryPoint":
            hook.data.geometryType = 'POINT'
            break;
          case "esriGeometryMultipoint":
            hook.data.geometryType = 'MULTIPOINT'
            break;
          case "esriGeometryLine":
            hook.data.geometryType = 'LINE'
            break;
          case "esriGeometryMultiLineString":
            hook.data.geometryType = 'MULTILINESTRING'
            break;
          case "esriGeometryPolygon":
            hook.data.geometryType = 'POLYGON'
            break;
        }

        hook.data.fields = metadata.fields;
        resolve();
      });
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
    var sequelize = hook.app.get('sequelize');
    return new Promise(function(resolve, reject){
      request({
        url: hook.data.url + '/query',
        qs: {
          returnGeometry: true,
          where: '1=1',
          outFields: '*',
          f: 'geojson'
        }
      }, function(err, res, body){
        if (err) return reject(err);
        var data = JSON.parse(body);

        var schema = {
          geometry: { type: Sequelize.GEOMETRY }
        }

        _.each(hook.data.fields, function(field){
          var fieldType = esriToSequelizeType(field.type);
          if (fieldType) schema[field.name] = { type: fieldType }
        });

        // create feature table
        var Features = sequelize.define(hook.data.id, schema);
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
              doneEach()
            }).catch(reject);
          }, resolve);

        }).catch(reject);

      });
    });
  }],
  update: [],
  patch: [],
  remove: []
};
